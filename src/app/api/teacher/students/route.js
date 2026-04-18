import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

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

    // Auto-generate enrollment number
    let generatedEnrollmentNo = enrollmentNo;
    
    if (!enrollmentNo) {
      // Find the highest enrollment number for this school
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
      
      // Generate new enrollment number with leading zeros
      generatedEnrollmentNo = `KIDSTU-${String(nextNumber).padStart(6, '0')}`;
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

    await newStudent.populate("class", "name level section");

    return Response.json(
      { message: "Student created successfully", student: newStudent },
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
