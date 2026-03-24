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

    // Check if enrollment number already exists
    if (enrollmentNo) {
      const existing = await Student.findOne({ school: schoolId, enrollmentNo });
      if (existing) {
        return Response.json({ error: "Enrollment number already exists" }, { status: 400 });
      }
    }

    const newStudent = await Student.create({
      firstName,
      lastName,
      email,
      enrollmentNo,
      dateOfBirth,
      gender,
      class: classId,
      school: schoolId,
      guardian,
      address,
      phone,
      medicalInfo,
      photo,
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

    const students = await Student.find(query)
      .populate("class", "name level section")
      .sort({ firstName: 1, lastName: 1 });

    return Response.json({ students }, { status: 200 });
  } catch (error) {
    console.error("[Students Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
