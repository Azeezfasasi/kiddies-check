import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import User from "@/app/server/models/User";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";

function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required";
  }
  for (const q of questions) {
    if (!q.text || !q.text.trim()) return "Every question needs text";
    if (!Array.isArray(q.options) || q.options.length < 2) return "Every question needs at least two options";
    if (q.options.filter((o) => o.isCorrect).length !== 1) return "Every question needs exactly one correct option";
    if (q.options.some((o) => !o.text || !o.text.trim())) return "Every option needs text";
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id)
      .populate("class", "name level section")
      .populate("subject", "name")
      .populate("createdBy", "firstName lastName");

    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const questions = await ExamQuestion.find({ exam: id }).sort({ order: 1 });

    return NextResponse.json({ success: true, exam, questions }, { status: 200 });
  } catch (error) {
    console.error("[Exam GET by ID Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    if (exam.status !== "draft") {
      return NextResponse.json({ success: false, message: "Only draft exams can be edited. Close this exam and create a new one instead." }, { status: 409 });
    }

    if (body.questions) {
      const questionError = validateQuestions(body.questions);
      if (questionError) {
        return NextResponse.json({ success: false, message: questionError }, { status: 400 });
      }

      await ExamQuestion.deleteMany({ exam: id });
      await ExamQuestion.insertMany(
        body.questions.map((q, index) => ({
          exam: id,
          order: index,
          text: q.text,
          type: q.type === "true-false" ? "true-false" : "single-choice",
          options: q.options.map((o) => ({ text: o.text, isCorrect: Boolean(o.isCorrect) })),
          marks: Number(q.marks) || 1,
        }))
      );
      exam.totalMarks = body.questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
    }

    exam.title = body.title ?? exam.title;
    exam.term = body.term ?? exam.term;
    exam.academicYear = body.academicYear ?? exam.academicYear;
    exam.durationMinutes = body.durationMinutes ?? exam.durationMinutes;
    exam.instructions = body.instructions ?? exam.instructions;

    await exam.save();

    return NextResponse.json({ success: true, exam }, { status: 200 });
  } catch (error) {
    console.error("[Exam PUT Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const attemptCount = await ExamAttempt.countDocuments({ exam: id });
    if (attemptCount > 0) {
      return NextResponse.json({ success: false, message: "This exam already has student attempts and can't be deleted. Close it instead." }, { status: 409 });
    }

    await ExamQuestion.deleteMany({ exam: id });
    await exam.deleteOne();

    return NextResponse.json({ success: true, message: "Exam deleted" }, { status: 200 });
  } catch (error) {
    console.error("[Exam DELETE Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
