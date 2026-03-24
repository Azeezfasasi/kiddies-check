import Class from "@/app/server/models/Class";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { schoolId, name, level, section, classTeacher, numberOfStudents, description } = await req.json();

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
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.equals(schoolId)) || 
        (user?.managedSchools && user.managedSchools.includes(schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    // Check if class already exists
    const existingClass = await Class.findOne({ school: schoolId, name });
    if (existingClass) {
      return Response.json({ error: "Class with this name already exists" }, { status: 400 });
    }

    const newClass = await Class.create({
      school: schoolId,
      name,
      level: level || "primary",
      section: section || "A",
      classTeacher: classTeacher || userId,
      numberOfStudents: numberOfStudents || 0,
      description,
      createdBy: userId,
    });

    return Response.json(
      { message: "Class created successfully", class: newClass },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Classes Create Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

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

    const classes = await Class.find({ school: schoolId, isActive: true })
      .populate("classTeacher", "firstName lastName email")
      .sort({ name: 1 });

    return Response.json({ classes }, { status: 200 });
  } catch (error) {
    console.error("[Classes Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
