import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";
import ActivityLog from "@/app/server/models/ActivityLog";
import { connectDB } from "@/utils/db";
import { Types } from "mongoose";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Connect to database FIRST, before any queries
    await connectDB();

    // Verify user access
    const user = await User.findById(userId);
    // const hasAccess = user && (
    //   (user.schoolId && user.schoolId.toString() === schoolId) || 
    //   (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId))
    // );
    let hasAccess = user && (
      ['admin', 'learning-specialist'].includes(user.role) ||
      (user.schoolId && user.schoolId.toString() === schoolId) || 
      (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId))
    );
    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

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
    const { id } = await params;
    const body = await req.json();
    const { name, level, section, classTeacher, numberOfStudents, description, isActive, subjects } = body;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Connect to database FIRST, before any queries
    await connectDB();

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

    // Allow explicit unassignment: if request includes `classTeacher` (even null or empty), apply it.
    const updatePayload = {
      name: name || classData.name,
      level: level || classData.level,
      section: section || classData.section,
      numberOfStudents: numberOfStudents !== undefined ? numberOfStudents : classData.numberOfStudents,
      description: description || classData.description,
      subjects: subjects !== undefined ? subjects : classData.subjects,
      isActive: isActive !== undefined ? isActive : classData.isActive,
    };

    if (Object.prototype.hasOwnProperty.call(body, 'classTeacher')) {
      // If client sent an explicit classTeacher (could be empty string), set accordingly
      updatePayload.classTeacher = classTeacher && classTeacher !== "" ? classTeacher : null;
    } else {
      updatePayload.classTeacher = classData.classTeacher;
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true }
    ).populate("classTeacher", "firstName lastName email")
      .populate("subjects", "name code");

    // Audit log: record assignment changes when classTeacher differs
    try {
      const prevTeacherId = classData.classTeacher ? classData.classTeacher.toString() : null;
      const newTeacher = updatedClass.classTeacher ? (updatedClass.classTeacher._id ? updatedClass.classTeacher : null) : null;
      const newTeacherId = newTeacher ? newTeacher._id.toString() : null;

      if (prevTeacherId !== newTeacherId) {
        // Try to resolve user names for better audit descriptions
        let prevLabel = prevTeacherId || null;
        let newLabel = newTeacherId || null;
        try {
          if (prevTeacherId) {
            const prevUser = await User.findById(prevTeacherId).select("firstName lastName email");
            if (prevUser) prevLabel = `${prevUser.firstName || ''} ${prevUser.lastName || ''}`.trim() || prevUser.email || prevTeacherId;
          }
        } catch (e) {
          // ignore resolution errors
        }
        try {
          if (newTeacherId) {
            // updatedClass.classTeacher is populated where possible
            if (updatedClass.classTeacher && (updatedClass.classTeacher.firstName || updatedClass.classTeacher.lastName)) {
              newLabel = `${updatedClass.classTeacher.firstName || ''} ${updatedClass.classTeacher.lastName || ''}`.trim() || updatedClass.classTeacher.email || newTeacherId;
            } else {
              const newUser = await User.findById(newTeacherId).select("firstName lastName email");
              if (newUser) newLabel = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim() || newUser.email || newTeacherId;
            }
          }
        } catch (e) {
          // ignore
        }

        await ActivityLog.create({
          user: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userRole: user.role,
          school: schoolId,
          action: "update",
          entityType: "class",
          entityId: id,
          entityName: updatedClass.name,
          description: `Class teacher changed from ${prevLabel || 'Unassigned'} to ${newLabel || 'Unassigned'}`,
          changes: {
            before: { classTeacher: prevTeacherId, classTeacherName: prevLabel || null },
            after: { classTeacher: newTeacherId, classTeacherName: newLabel || null },
          },
        });
      }
    } catch (e) {
      console.warn("Failed to create ActivityLog for class assignment:", e.message);
    }

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
    const { id } = await params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    await connectDB();

    // Verify user has access to this school
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const schoolObjectId = new Types.ObjectId(schoolId);
    
    // Allow admin and learning-specialist full access to any school
    let hasAccess = ['admin', 'learning-specialist'].includes(user.role);

    // If not admin/learning-specialist, check schoolId or SchoolMember
    if (!hasAccess) {
      // Check User model for schoolId
      if (user.schoolId && user.schoolId.toString() === schoolId) {
        hasAccess = true;
      } else if (user.managedSchools && user.managedSchools.some(sid => sid.toString() === schoolId)) {
        hasAccess = true;
      } else {
        // Check SchoolMember for teachers, school-leaders, etc.
        const schoolMemberAccess = await SchoolMember.findOne({
          user: userId,
          school: schoolObjectId,
          status: "active",
        });
        hasAccess = !!schoolMemberAccess;
      }
    }

    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const classData = await Class.findOne({ _id: id, school: schoolId });
    if (!classData) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }

    const hardDelete = req.nextUrl.searchParams.get("hard") === "true";

    if (hardDelete) {
      await Class.findByIdAndDelete(id);
      return Response.json({ message: "Class permanently deleted" }, { status: 200 });
    }

    // Soft delete
    await Class.findByIdAndUpdate(id, { isActive: false });

    return Response.json({ message: "Class deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Class Delete Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
