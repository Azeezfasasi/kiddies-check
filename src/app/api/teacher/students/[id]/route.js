import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import Class from "@/app/server/models/Class";
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

    const student = await Student.findOne({ _id: id, school: schoolId }).populate("class", "name level section").populate("parent", "firstName lastName email phone avatar");

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    return Response.json({ student }, { status: 200 });
  } catch (error) {
    console.error("[Student Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;
    const updateData = await req.json();

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

    // Check student exists
    const student = await Student.findOne({ _id: id, school: schoolId });
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if new enrollment number conflicts
    if (updateData.enrollmentNo && updateData.enrollmentNo !== student.enrollmentNo) {
      const existing = await Student.findOne({ school: schoolId, enrollmentNo: updateData.enrollmentNo });
      if (existing) {
        return Response.json({ error: "Enrollment number already exists" }, { status: 400 });
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).populate("class", "name level section");

    // Log activity
    try {
      await ActivityLog.create({
        user: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userRole: user.role,
        school: schoolId,
        schoolName: user.schoolName,
        action: 'update',
        entityType: 'student',
        entityId: student._id.toString(),
        entityName: `${student.firstName} ${student.lastName}`,
        description: `Updated student information for ${student.firstName} ${student.lastName}`,
        changes: {
          before: {
            enrollmentNo: student.enrollmentNo,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email,
            dateOfBirth: student.dateOfBirth,
          },
          after: {
            enrollmentNo: updateData.enrollmentNo || student.enrollmentNo,
            firstName: updateData.firstName || student.firstName,
            lastName: updateData.lastName || student.lastName,
            email: updateData.email || student.email,
            dateOfBirth: updateData.dateOfBirth || student.dateOfBirth,
          }
        },
        status: 'success',
      });
    } catch (logError) {
      console.warn('[Activity Log Error]', logError);
    }

    return Response.json(
      { message: "Student updated successfully", student: updatedStudent },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Student Update Error]", error);
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

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Connect to database FIRST, before any queries
    await connectDB();

    // Verify user access
    const user = await User.findById(userId);
    let hasAccess = user && (
      ['admin', 'learning-specialist'].includes(user.role) ||
      (user.schoolId && user.schoolId.toString() === schoolId) || 
      (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId))
    );
    if (!hasAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const student = await Student.findOne({ _id: id, school: schoolId });
    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    const hardDelete = req.nextUrl.searchParams.get("hard") === "true";

    if (hardDelete) {
      await Student.findByIdAndDelete(id);
      return Response.json({ message: "Student permanently deleted" }, { status: 200 });
    }

    // Soft delete
    await Student.findByIdAndUpdate(id, { isActive: false });

    // Log activity
    try {
      await ActivityLog.create({
        user: userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userRole: user.role,
        school: schoolId,
        schoolName: user.schoolName,
        action: 'delete',
        entityType: 'student',
        entityId: student._id.toString(),
        entityName: `${student.firstName} ${student.lastName}`,
        description: `Deleted student record for ${student.firstName} ${student.lastName}`,
        changes: {
          before: { isActive: true },
          after: { isActive: false }
        },
        status: 'success',
      });
    } catch (logError) {
      console.warn('[Activity Log Error]', logError);
    }

    return Response.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Student Delete Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
