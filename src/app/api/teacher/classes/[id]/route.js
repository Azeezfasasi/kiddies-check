import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    const hasAccess = user && (
      (user.schoolId && user.schoolId.toString() === schoolId) || 
      (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId))
    );
    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const classData = await Class.findOne({ _id: id, school: schoolId })
      .populate("classTeacher", "firstName lastName email")
      .populate("subjects", "name code");

    if (!classData) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    return Response.json({ class: classData }, { status: 200 });
  } catch (error) {
    console.error("[Class Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;
    const { name, level, section, classTeacher, numberOfStudents, description, isActive, subjects } = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
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

    // Check class exists
    const classData = await Class.findOne({ _id: id, school: schoolId });
    if (!classData) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    // Check if new name conflicts
    if (name && name !== classData.name) {
      const existing = await Class.findOne({ school: schoolId, name });
      if (existing) {
        return Response.json({ error: "Class with this name already exists" }, { status: 400 });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        name: name || classData.name,
        level: level || classData.level,
        section: section || classData.section,
        classTeacher: classTeacher || classData.classTeacher,
        numberOfStudents: numberOfStudents !== undefined ? numberOfStudents : classData.numberOfStudents,
        description: description || classData.description,
        subjects: subjects !== undefined ? subjects : classData.subjects,
        isActive: isActive !== undefined ? isActive : classData.isActive,
      },
      { new: true }
    ).populate("classTeacher", "firstName lastName email")
      .populate("subjects", "name code");

    return Response.json(
      { message: "Class updated successfully", class: updatedClass },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Class Update Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    const hasAccess = user && (
      (user.schoolId && user.schoolId.toString() === schoolId) || 
      (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId))
    );
    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const classData = await Class.findOne({ _id: id, school: schoolId });
    if (!classData) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    // Soft delete
    await Class.findByIdAndUpdate(id, { isActive: false });

    return Response.json({ message: "Class deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Class Delete Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
