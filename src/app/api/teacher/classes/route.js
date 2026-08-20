import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { schoolId, name, level, section, classTeacher, numberOfStudents, description, subjects } = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Allow admin + learning-specialist full access to any school
    // Teachers are allowed only if they match the requested school (handled by hasAccess below)
    if (!['admin', 'learning-specialist', 'teacher'].includes(user.role)) {
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
      subjects: subjects || [],
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

    const query = { school: schoolId };
    const isActiveParam = req.nextUrl.searchParams.get("isActive");
    if (isActiveParam !== null) {
      query.isActive = isActiveParam === "true";
    } else {
      query.isActive = true;
    }

    let classes = await Class.find(query)
      .populate("classTeacher", "firstName lastName email")
      .populate("subjects", "name code")
      .sort({ name: 1 });

    // Teachers should only see classes they are assigned to.
    if (user.role === "teacher") {
      let assignedClasses = classes.filter(
        (c) => c.classTeacher && c.classTeacher._id.toString() === userId
      );

      // Fallback: legacy `teacher` field on Class
      if (assignedClasses.length === 0) {
        assignedClasses = classes.filter(
          (c) => c.teacher && c.teacher.toString() === userId
        );
      }

      // Fallback: classes reached via subjects this teacher teaches
      if (assignedClasses.length === 0) {
        const subjects = await Subject.find({ school: schoolId, teacher: userId }).select("classes");
        const classIdsFromSubjects = new Set(
          subjects.flatMap((s) => (s.classes || []).map((id) => id.toString()))
        );
        if (classIdsFromSubjects.size > 0) {
          assignedClasses = classes.filter((c) => classIdsFromSubjects.has(c._id.toString()));
        }
      }

      classes = assignedClasses;
    }

    return Response.json({ classes }, { status: 200 });
  } catch (error) {
    console.error("[Classes Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
