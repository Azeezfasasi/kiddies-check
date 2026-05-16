import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";
import crypto from "crypto";

// Helper function to find the next available enrollment number
async function getNextAvailableEnrollmentNo(schoolId, startingNumber = 1) {
  let nextNumber = startingNumber;
  let enrollmentNo = `KIDSTU-${String(nextNumber).padStart(6, '0')}`;
  
  // Keep incrementing until we find a number that doesn't exist
  while (await Student.findOne({ school: schoolId, enrollmentNo })) {
    nextNumber++;
    enrollmentNo = `KIDSTU-${String(nextNumber).padStart(6, '0')}`;
  }
  
  return enrollmentNo;
}

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const {
      schoolId,
      firstName,
      lastName,
      email,
      enrollmentNo,
      dateOfBirth,
      gender,
      class: classId,
      guardian,
      address,
      phone,
      medicalInfo,
      photo,
      schoolType,
    } = await req.json();

    if (!userId || !schoolId || !classId) {
      return Response.json({ error: "User, school, and class information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Allow admin and learning-specialist full access to any school
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(id => id.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    // Auto-generate or validate enrollment number
    // Normalize input - treat empty/whitespace as no enrollment number
    const trimmedEnrollmentNo = enrollmentNo?.trim?.() || null;
    let generatedEnrollmentNo = null;
    
    if (!trimmedEnrollmentNo) {
      // No enrollment number provided, find the highest one and get next available
      const lastStudent = await Student.findOne({ school: schoolId, enrollmentNo: { $exists: true, $ne: null } })
        .sort({ enrollmentNo: -1 })
        .select("enrollmentNo");
      
      let nextNumber = 1;
      
      if (lastStudent && lastStudent.enrollmentNo) {
        // Extract the number from format KIDSTU-000001
        const match = lastStudent.enrollmentNo.match(/KIDSTU-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      // Generate new enrollment number, handling any gaps in sequence
      generatedEnrollmentNo = await getNextAvailableEnrollmentNo(schoolId, nextNumber);
    } else {
      // Enrollment number was provided, normalize it to the full format
      const normalizedEnrollmentNo = trimmedEnrollmentNo.includes('KIDSTU-') 
        ? trimmedEnrollmentNo 
        : `KIDSTU-${String(trimmedEnrollmentNo).padStart(6, '0')}`;
      
      // Check if the normalized enrollment number already exists
      const existingStudent = await Student.findOne({ school: schoolId, enrollmentNo: normalizedEnrollmentNo });
      
      if (existingStudent) {
        // If it exists, extract the number and find the next available one
        const match = normalizedEnrollmentNo.match(/KIDSTU-(\d+)/);
        let startingNumber = 1;
        
        if (match) {
          startingNumber = parseInt(match[1]) + 1;
        }
        
        console.warn(
          `Enrollment number ${normalizedEnrollmentNo} already exists for school ${schoolId}. ` +
          `Auto-assigning next available number.`
        );
        
        generatedEnrollmentNo = await getNextAvailableEnrollmentNo(schoolId, startingNumber);
      } else {
        // Enrollment number is available, use the normalized version
        generatedEnrollmentNo = normalizedEnrollmentNo;
      }
    }

    const newStudent = await Student.create({
      firstName,
      lastName,
      email,
      enrollmentNo: generatedEnrollmentNo,
      dateOfBirth,
      gender,
      class: classId,
      school: schoolId,
      guardian,
      address,
      phone,
      medicalInfo,
      photo,
      schoolType,
      admissionDate: new Date(),
      createdBy: userId,
    });

    // Generate unique QR code string for the student
    const qrCodeString = `KC-STU-${schoolId}-${newStudent._id.toString()}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();
    newStudent.qrCode = qrCodeString;
    await newStudent.save();

    await newStudent.populate("class", "name level section");

    // Prepare response message
    const wasEnrollmentAutoAssigned = enrollmentNo && enrollmentNo !== generatedEnrollmentNo;
    let message = "Student created successfully";
    if (wasEnrollmentAutoAssigned) {
      message += `. Enrollment number "${enrollmentNo}" was already taken, auto-assigned "${generatedEnrollmentNo}" instead.`;
    }

    return Response.json(
      { 
        message,
        student: newStudent,
        enrollmentNoAutoAssigned: wasEnrollmentAutoAssigned,
        assignedEnrollmentNo: generatedEnrollmentNo
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Students Create Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const classId = req.nextUrl.searchParams.get("classId");
    const parentId = req.nextUrl.searchParams.get("parentId");

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Allow admin and learning-specialist full access to any school
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasAccess = 
        (user.schoolId && user.schoolId.toString() === schoolId) || 
        (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId));
      
      if (!hasAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    const query = { school: schoolId, isActive: true };
    if (classId) {
      query.class = classId;
    }
    if (parentId) {
      query.parent = parentId;
    }

    const students = await Student.find(query)
      .populate("class", "name level section")
      .populate("parent", "firstName lastName email phone avatar")
      .sort({ firstName: 1, lastName: 1 });

    return Response.json({ data: students }, { status: 200 });
  } catch (error) {
    console.error("[Students Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
