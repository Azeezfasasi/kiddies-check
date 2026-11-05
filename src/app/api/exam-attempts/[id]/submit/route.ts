import { withAudit } from "@/app/server/lib/audit";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import Exam from "@/app/server/models/Exam";
import Assessment from "@/app/server/models/Assessment";
import { verifyAttemptToken } from "@/app/server/lib/examAttemptToken";
import { getGradeLevel, scoreAttempt, examAssessmentRemarks } from "@/app/server/lib/examGrading";

function currentIsoWeek(date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((Number(target) - Number(firstThursday)) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return week;
}

// POST /api/exam-attempts/[id]/submit — grades objective answers immediately, then writes
// the result into Assessment (assessmentType: "exam") so report-card auto-population picks
// it up through the same aggregation path as any manually recorded assessment.
async function postHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { score, maxScore, percentageScore } = scoreAttempt(attempt, questions);

    const now = new Date();
    attempt.score = score;
    attempt.maxScore = maxScore;
    attempt.submittedAt = now;
    attempt.autoSubmitted = Boolean(body.autoSubmitted);
    attempt.status = "graded";
    await attempt.save();

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
      remarks: examAssessmentRemarks(exam.title),
      assessmentType: "exam",
      teacher: exam.createdBy,
      examAttempt: attempt._id,
    });

    return NextResponse.json({ success: true, score, maxScore, percentageScore }, { status: 200 });
  } catch (error) {
    console.error("[Exam Attempt Submit Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export const POST = withAudit(postHandler);
