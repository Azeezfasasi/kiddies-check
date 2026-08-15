import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import Student from "@/app/server/models/Student";
import { signAttemptToken } from "@/app/server/lib/examAttemptToken";

// POST /api/exams/[id]/join — no user session involved. A student picks their name from
// the class roster and enters the access code the teacher shared with the room.
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { studentId, accessCode } = await req.json();

    if (!studentId || !accessCode) {
      return NextResponse.json({ success: false, message: "Select your name and enter the access code" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    if (exam.status !== "published") {
      return NextResponse.json({ success: false, message: "This exam is not currently open" }, { status: 409 });
    }

    const now = new Date();
    if (exam.availableFrom && now < exam.availableFrom) {
      return NextResponse.json({ success: false, message: "This exam has not started yet" }, { status: 409 });
    }
    if (exam.availableUntil && now > exam.availableUntil) {
      return NextResponse.json({ success: false, message: "This exam has closed" }, { status: 409 });
    }

    if (String(accessCode).trim().toUpperCase() !== exam.accessCode) {
      return NextResponse.json({ success: false, message: "Incorrect access code" }, { status: 401 });
    }

    const student = await Student.findOne({ _id: studentId, school: exam.school, class: exam.class, isActive: true });
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found in this class" }, { status: 404 });
    }

    let attempt = await ExamAttempt.findOne({ exam: exam._id, student: student._id });

    if (attempt && attempt.status !== "in-progress") {
      return NextResponse.json({ success: false, message: "You have already submitted this exam" }, { status: 409 });
    }

    if (!attempt) {
      attempt = await ExamAttempt.create({
        exam: exam._id,
        school: exam.school,
        student: student._id,
        startedAt: now,
        maxScore: exam.totalMarks,
        status: "in-progress",
      });
    }

    // Give a little headroom past the exam duration so a slow connection doesn't lock a student out mid-submit.
    const secondsRemaining = Math.max(60, exam.durationMinutes * 60 - Math.floor((now - attempt.startedAt) / 1000) + 120);
    const token = signAttemptToken({ attemptId: attempt._id.toString(), examId: exam._id.toString(), studentId: student._id.toString() }, secondsRemaining);

    const questions = await ExamQuestion.find({ exam: exam._id })
      .sort({ order: 1 })
      .select("-options.isCorrect");

    const previousAnswers = Object.fromEntries(attempt.answers.map((a) => [a.question.toString(), a.selectedOptionId?.toString() || null]));

    return NextResponse.json(
      {
        success: true,
        token,
        attemptId: attempt._id,
        startedAt: attempt.startedAt,
        durationMinutes: exam.durationMinutes,
        exam: { title: exam.title, instructions: exam.instructions, totalMarks: exam.totalMarks },
        student: { id: student._id, name: `${student.firstName} ${student.lastName}` },
        questions,
        previousAnswers,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Exam Join Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
