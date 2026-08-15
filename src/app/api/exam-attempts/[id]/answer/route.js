import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import { verifyAttemptToken } from "@/app/server/lib/examAttemptToken";

// POST /api/exam-attempts/[id]/answer — autosaves a single answer during a timed sitting.
// Authorized purely by the short-lived attempt token issued at /join, not a user session.
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { questionId, selectedOptionId } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, message: "Missing attempt token" }, { status: 401 });
    }
    if (!questionId) {
      return NextResponse.json({ success: false, message: "questionId is required" }, { status: 400 });
    }

    let decoded;
    try {
      decoded = verifyAttemptToken(token);
    } catch (error) {
      return NextResponse.json({ success: false, message: "Your session for this exam has expired" }, { status: 401 });
    }

    if (decoded.attemptId !== id) {
      return NextResponse.json({ success: false, message: "Token does not match this attempt" }, { status: 403 });
    }

    await connectDB();

    const attempt = await ExamAttempt.findById(id);
    if (!attempt) {
      return NextResponse.json({ success: false, message: "Attempt not found" }, { status: 404 });
    }
    if (attempt.status !== "in-progress") {
      return NextResponse.json({ success: false, message: "This exam has already been submitted" }, { status: 409 });
    }

    const existingIndex = attempt.answers.findIndex((a) => a.question.toString() === questionId);
    if (existingIndex >= 0) {
      attempt.answers[existingIndex].selectedOptionId = selectedOptionId || null;
    } else {
      attempt.answers.push({ question: questionId, selectedOptionId: selectedOptionId || null });
    }

    await attempt.save();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Exam Attempt Answer Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
