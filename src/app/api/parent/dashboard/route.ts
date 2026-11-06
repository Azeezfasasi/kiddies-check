import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authenticateRequest } from "@/app/server/lib/requireAccess";
import { connectDB } from "@/utils/db";
import Student from "@/app/server/models/Student";
import Attendance from "@/app/server/models/Attendance";
import Assessment from "@/app/server/models/Assessment";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import ReportCard from "@/app/server/models/ReportCard";
import Feedback from "@/app/server/models/Feedback";
import "@/app/server/models/Subject";
import "@/app/server/models/Exam";
import "@/app/server/models/Class";

const DAY = 24 * 60 * 60 * 1000;
const WEEKS_OF_TREND = 12;

const round1 = (n: number) => Math.round(n * 10) / 10;
const average = (values: number[]) => (values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : null);

// Assessment percentage, falling back to score / maxScore for older records
const percentOf = (a) =>
  typeof a.percentage === "number" ? a.percentage : a.maxScore ? (a.score / a.maxScore) * 100 : a.score;

// Monday 00:00 (local server time) of the week containing `date`
const startOfWeek = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

async function childSummary(child, now: Date) {
  const last30 = new Date(now.getTime() - 30 * DAY);
  const prev30 = new Date(now.getTime() - 60 * DAY);
  const trendStart = new Date(startOfWeek(now).getTime() - (WEEKS_OF_TREND - 1) * 7 * DAY);
  const subjectWindow = new Date(now.getTime() - 90 * DAY);

  const [attendance, assessments, attempts, reportCards, recentFeedback, feedbackLast30] = await Promise.all([
    Attendance.find({ student: child._id, date: { $gte: last30 } }).select("status date").lean(),
    Assessment.find({ student: child._id, date: { $gte: new Date(Math.min(trendStart.getTime(), prev30.getTime(), subjectWindow.getTime())) } })
      .select("subject score maxScore percentage gradeLevel assessmentType date")
      .populate("subject", "name")
      .sort({ date: -1 })
      .lean(),
    ExamAttempt.find({ student: child._id, status: "graded" })
      .select("exam score maxScore submittedAt")
      .populate("exam", "title")
      .sort({ submittedAt: -1 })
      .lean(),
    ReportCard.countDocuments({ student: child._id, status: "published" }),
    Feedback.find({ student: child._id, isVisible: { $ne: false } })
      .select("title comment category author authorRole createdAt replies")
      .populate("author", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Feedback.countDocuments({ student: child._id, isVisible: { $ne: false }, createdAt: { $gte: last30 } }),
  ]);

  // Attendance, last 30 days
  const attendanceCounts = { present: 0, late: 0, absent: 0 };
  for (const record of attendance) {
    if (record.status in attendanceCounts) attendanceCounts[record.status] += 1;
  }
  const attendanceDays = attendanceCounts.present + attendanceCounts.late + attendanceCounts.absent;
  const attendanceRate = attendanceDays
    ? round1(((attendanceCounts.present + attendanceCounts.late) / attendanceDays) * 100)
    : null;

  // Average score, last 30 days vs the 30 days before
  const inRange = (a, from: Date, to: Date) => new Date(a.date) >= from && new Date(a.date) < to;
  const recentScores = assessments.filter((a) => inRange(a, last30, new Date(now.getTime() + DAY))).map(percentOf);
  const previousScores = assessments.filter((a) => inRange(a, prev30, last30)).map(percentOf);
  const averageScore = average(recentScores);
  const previousAverage = average(previousScores);

  // Weekly average score, last 12 weeks (weeks without assessments are null, drawn as gaps)
  const weeks = Array.from({ length: WEEKS_OF_TREND }, (_, i) => new Date(trendStart.getTime() + i * 7 * DAY));
  const scoreTrend = weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart.getTime() + 7 * DAY);
    const scores = assessments.filter((a) => inRange(a, weekStart, weekEnd)).map(percentOf);
    return { weekStart: weekStart.toISOString(), average: average(scores), count: scores.length };
  });

  // Average per subject, last 90 days
  const bySubject = new Map<string, { name: string; scores: number[] }>();
  for (const a of assessments) {
    if (new Date(a.date) < subjectWindow) continue;
    const subject = a.subject as unknown as { _id: unknown; name?: string } | null;
    const key = subject ? String(subject._id) : "unknown";
    if (!bySubject.has(key)) bySubject.set(key, { name: subject?.name || "Other", scores: [] });
    bySubject.get(key).scores.push(percentOf(a));
  }
  const subjectAverages = [...bySubject.values()]
    .map((s) => ({ subject: s.name, average: average(s.scores), count: s.scores.length }))
    .sort((a, b) => b.average - a.average);

  // CBT exams
  const examPercents = attempts.filter((a) => a.maxScore > 0).map((a) => (a.score / a.maxScore) * 100);
  const latestAttempt = attempts[0];

  return {
    _id: String(child._id),
    firstName: child.firstName,
    lastName: child.lastName,
    picture: child.picture || null,
    className: (child.class as unknown as { name?: string } | null)?.name || null,
    attendance: { ...attendanceCounts, days: attendanceDays, rate: attendanceRate },
    scores: {
      average: averageScore,
      previousAverage,
      change: averageScore !== null && previousAverage !== null ? round1(averageScore - previousAverage) : null,
      assessmentsLast30: recentScores.length,
    },
    scoreTrend,
    subjectAverages,
    exams: {
      taken: attempts.length,
      average: average(examPercents),
      latest: latestAttempt
        ? {
            title: (latestAttempt.exam as unknown as { title?: string } | null)?.title || "CBT exam",
            score: latestAttempt.score,
            maxScore: latestAttempt.maxScore,
            submittedAt: latestAttempt.submittedAt,
          }
        : null,
    },
    reportCards: reportCards,
    feedback: {
      last30: feedbackLast30,
      recent: recentFeedback.map((f) => {
        const author = f.author as unknown as { firstName?: string; lastName?: string } | null;
        return {
          _id: String(f._id),
          title: f.title,
          comment: f.comment,
          category: f.category,
          authorName: author ? `${author.firstName || ""} ${author.lastName || ""}`.trim() : "School staff",
          authorRole: f.authorRole,
          replies: Array.isArray(f.replies) ? f.replies.length : 0,
          createdAt: f.createdAt,
        };
      }),
    },
    recentAssessments: assessments.slice(0, 5).map((a) => ({
      _id: String(a._id),
      subject: (a.subject as unknown as { name?: string } | null)?.name || "Subject",
      percentage: round1(percentOf(a)),
      gradeLevel: a.gradeLevel || null,
      assessmentType: a.assessmentType,
      date: a.date,
    })),
  };
}

// GET /api/parent/dashboard — stats and chart data for the signed-in parent's children
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if ("response" in auth) return auth.response;
    const { user } = auth;

    if (user.role !== "parent") {
      return NextResponse.json({ success: false, message: "Only parents have a children dashboard" }, { status: 403 });
    }

    await connectDB();

    const children = await Student.find({ parent: user._id, isActive: { $ne: false } })
      .select("firstName lastName picture class")
      .populate("class", "name")
      .sort({ firstName: 1 })
      .lean();

    const now = new Date();
    const summaries = await Promise.all(children.map((child) => childSummary(child, now)));

    return NextResponse.json({ success: true, children: summaries }, { status: 200 });
  } catch (error) {
    console.error("[Parent dashboard error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
