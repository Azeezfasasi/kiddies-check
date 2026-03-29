import Feedback from "@/app/server/models/Feedback";
import User from "@/app/server/models/User";
import Student from "@/app/server/models/Student";
import { connectDB } from "@/utils/db";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    await connectDB();

    const feedback = await Feedback.findOne({ _id: id, school: schoolId })
      .populate('student', 'firstName lastName enrollmentNo')
      .populate('author', 'firstName lastName avatar role')
      .populate('replies.author', 'firstName lastName avatar role');

    if (!feedback) {
      return Response.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Verify user can access this feedback
    const user = await User.findById(userId);
    if (user.role === 'parent') {
      const student = await Student.findById(feedback.student._id);
      if (!student.parent || student.parent.toString() !== userId) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return Response.json({ feedback }, { status: 200 });
  } catch (error) {
    console.error("[Get Feedback Detail Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;
    const { title, comment, category, rating } = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    await connectDB();

    const feedback = await Feedback.findOne({ _id: id, school: schoolId });
    if (!feedback) {
      return Response.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Only author or admin can update
    if (feedback.author.toString() !== userId) {
      const user = await User.findById(userId);
      if (!['admin', 'learning-specialist'].includes(user.role)) {
        return Response.json({ error: "Unauthorized to update this feedback" }, { status: 403 });
      }
    }

    const updatedFeedback = await Feedback.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(comment && { comment }),
        ...(category && { category }),
        ...(rating !== undefined && { rating }),
        updatedAt: new Date(),
      },
      { new: true }
    ).populate('author', 'firstName lastName avatar role')
      .populate('replies.author', 'firstName lastName avatar role');

    return Response.json(
      { message: "Feedback updated successfully", feedback: updatedFeedback },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Update Feedback Error]", error);
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

    const feedback = await Feedback.findOne({ _id: id, school: schoolId });
    if (!feedback) {
      return Response.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Only author or admin can delete
    const user = await User.findById(userId);
    if (feedback.author.toString() !== userId && !['admin', 'learning-specialist'].includes(user.role)) {
      return Response.json({ error: "Unauthorized to delete this feedback" }, { status: 403 });
    }

    await Feedback.findByIdAndDelete(id);

    return Response.json({ message: "Feedback deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Delete Feedback Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;
    const { action, reply } = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    if (!action) {
      return Response.json({ error: "Action is required" }, { status: 400 });
    }

    await connectDB();

    const feedback = await Feedback.findOne({ _id: id, school: schoolId });
    if (!feedback) {
      return Response.json({ error: "Feedback not found" }, { status: 404 });
    }

    const user = await User.findById(userId);

    if (action === 'add-reply') {
      if (!reply || !reply.comment) {
        return Response.json({ error: "Reply comment is required" }, { status: 400 });
      }

      const newReply = {
        _id: new mongoose.Types.ObjectId(),
        author: userId,
        authorRole: user.role,
        comment: reply.comment,
        createdAt: new Date(),
      };

      feedback.replies.push(newReply);
      await feedback.save();

      const updatedFeedback = await Feedback.findById(id)
        .populate('replies.author', 'firstName lastName avatar role');

      return Response.json(
        { message: "Reply added successfully", feedback: updatedFeedback },
        { status: 200 }
      );
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[Feedback Action Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
