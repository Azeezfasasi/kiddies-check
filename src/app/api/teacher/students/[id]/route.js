import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
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
    const hasAccess = user && (
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

    // Soft delete
    await Student.findByIdAndUpdate(id, { isActive: false });

    return Response.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Student Delete Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
