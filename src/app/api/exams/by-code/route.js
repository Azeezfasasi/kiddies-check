import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import Student from "@/app/server/models/Student";

// GET /api/exams/by-code?code=XXXXXX — public lookup so a student can resolve which exam
// and class roster an access code belongs to, before picking their name to join.
export async function GET(req) {
  try {
    const code = (req.nextUrl.searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ success: false, message: "Enter an access code" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findOne({ accessCode: code, status: "published" });
    if (!exam) {
      return NextResponse.json({ success: false, message: "No open exam found for that code" }, { status: 404 });
    }

    const now = new Date();
    if (exam.availableFrom && now < exam.availableFrom) {
      return NextResponse.json({ success: false, message: "This exam has not started yet" }, { status: 409 });
    }
    if (exam.availableUntil && now > exam.availableUntil) {
      return NextResponse.json({ success: false, message: "This exam has closed" }, { status: 409 });
    }

    const students = await Student.find({ class: exam.class, school: exam.school, isActive: true })
      .select("firstName lastName")
      .sort({ firstName: 1, lastName: 1 });

    return NextResponse.json(
      {
        success: true,
        examId: exam._id,
        exam: { title: exam.title, durationMinutes: exam.durationMinutes, instructions: exam.instructions },
        students,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Exam By Code Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
