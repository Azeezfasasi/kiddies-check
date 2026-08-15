import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import Exam from "@/app/server/models/Exam";
import Assessment from "@/app/server/models/Assessment";
import { verifyAttemptToken } from "@/app/server/lib/examAttemptToken";

function getGradeLevel(score) {
  if (score >= 75) return "A1";
  if (score >= 70) return "B2";
  if (score >= 65) return "C4";
  if (score >= 55) return "C5";
  if (score >= 50) return "C6";
  if (score >= 45) return "D7";
  if (score >= 40) return "E8";
  return "F";
}

function currentIsoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return week;
}

// POST /api/exam-attempts/[id]/submit — grades objective answers immediately, then writes
// the result into Assessment (assessmentType: "exam") so report-card auto-population picks
// it up through the same aggregation path as any manually recorded assessment.
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const body = await req.json().catch(() => ({}));

    if (!token) {
      return NextResponse.json({ success: false, message: "Missing attempt token" }, { status: 401 });
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

    if (attempt.status === "graded") {
      return NextResponse.json({ success: true, score: attempt.score, maxScore: attempt.maxScore, alreadySubmitted: true }, { status: 200 });
    }

    const exam = await Exam.findById(attempt.exam);
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const questions = await ExamQuestion.find({ exam: exam._id });
    const answerByQuestion = new Map(attempt.answers.map((a) => [a.question.toString(), a.selectedOptionId?.toString() || null]));

    let score = 0;
    const maxScore = questions.reduce((sum, q) => sum + q.marks, 0);

    for (const q of questions) {
      const selectedOptionId = answerByQuestion.get(q._id.toString());
      if (!selectedOptionId) continue;
      const correctOption = q.options.find((o) => o.isCorrect);
      if (correctOption && correctOption._id.toString() === selectedOptionId) {
        score += q.marks;
      }
    }

    const now = new Date();
    attempt.score = score;
    attempt.maxScore = maxScore;
    attempt.submittedAt = now;
    attempt.autoSubmitted = Boolean(body.autoSubmitted);
    attempt.status = "graded";
    await attempt.save();

    const percentageScore = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;

    await Assessment.create({
      student: attempt.student,
      subject: exam.subject,
      class: exam.class,
      school: exam.school,
      week: currentIsoWeek(now),
      year: now.getFullYear(),
      date: now,
      score: percentageScore,
      maxScore: 100,
      gradeLevel: getGradeLevel(percentageScore),
      remarks: `Auto-graded CBT exam: ${exam.title}`,
      assessmentType: "exam",
      teacher: exam.createdBy,
    });

    return NextResponse.json({ success: true, score, maxScore, percentageScore }, { status: 200 });
  } catch (error) {
    console.error("[Exam Attempt Submit Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
