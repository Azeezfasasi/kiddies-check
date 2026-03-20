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
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const subject = await Subject.findOne({ _id: id, school: schoolId })
      .populate("teacher", "firstName lastName email")
      .populate("classes", "name level section");

    if (!subject) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    return Response.json({ subject }, { status: 200 });
  } catch (error) {
    console.error("[Subject Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;
    const updateData = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // Check subject exists
    const subject = await Subject.findOne({ _id: id, school: schoolId });
    if (!subject) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    // Check if new name conflicts
    if (updateData.name && updateData.name !== subject.name) {
      const existing = await Subject.findOne({ school: schoolId, name: updateData.name });
      if (existing) {
        return Response.json({ error: "Subject with this name already exists" }, { status: 400 });
      }
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    )
      .populate("teacher", "firstName lastName email")
      .populate("classes", "name level section");

    return Response.json(
      { message: "Subject updated successfully", subject: updatedSubject },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Subject Update Error]", error);
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
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const subject = await Subject.findOne({ _id: id, school: schoolId });
    if (!subject) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    // Soft delete
    await Subject.findByIdAndUpdate(id, { isActive: false });

    return Response.json({ message: "Subject deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Subject Delete Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
