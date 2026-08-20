import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Assessment from "@/app/server/models/Assessment";
import AcademicCalendar from "@/app/server/models/AcademicCalendar";
import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";

const allowedRoles = ["admin", "learning-specialist", "school-leader", "teacher"];

async function canAccessSchool(user, schoolId) {
  if (!user) return false;
  if (allowedRoles.includes(user.role)) {
    if (user.role === "admin" || user.role === "learning-specialist") return true;
    if (user.schoolId && user.schoolId.toString() === schoolId) return true;
    if (user.managedSchools && user.managedSchools.some((id) => id.toString() === schoolId)) return true;
    return false;
  }
  return false;
}

const EXAM_TYPES = ["exam"];

function normalizeTermKey(term) {
  const t = (term || "").toLowerCase();
  if (t.includes("first") || t.includes("1st")) return "first";
  if (t.includes("second") || t.includes("2nd")) return "second";
  if (t.includes("third") || t.includes("3rd")) return "third";
  return null;
}

function average(scores) {
  if (!scores.length) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

// Report cards score continuous assessment out of 40 and exams out of 60 (100 total),
// but individual assessments can be recorded against any maxScore, so we scale each
// assessment to a percentage first and only then apply the report-card weighting.
const CA_MAX_MARKS = 40;
const EXAM_MAX_MARKS = 60;

// GET /api/report-cards/assessment-summary?schoolId=&studentId=&term=&academicYear=
// Aggregates a student's recorded assessments by subject so a report card draft
// can be pre-filled with CA / Exam / Total scores instead of starting blank.
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const term = req.nextUrl.searchParams.get("term") || "";
    const academicYear = req.nextUrl.searchParams.get("academicYear") || "";

    if (!userId || !schoolId || !studentId) {
      return NextResponse.json({ success: false, message: "User, school and student are required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, schoolId))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const student = await Student.findOne({ _id: studentId, school: schoolId });
    if (!student) {
      return NextResponse.json({ success: false, message: "Student not found in this school" }, { status: 404 });
    }

    // Prefer narrowing by the school's configured term window (AcademicCalendar).
    // Falls back to matching on Assessment.year alone when no calendar entry exists yet.
    const dateQuery = {};
    const termKey = normalizeTermKey(term);
    let usedCalendarWindow = false;

    if (termKey && academicYear) {
      const calendarTerm = await AcademicCalendar.findOne({ session: academicYear, term: termKey });
      if (calendarTerm) {
        dateQuery.date = { $gte: calendarTerm.startDate, $lte: calendarTerm.endDate };
        usedCalendarWindow = true;
      }
    }

    if (!usedCalendarWindow) {
      const yearMatch = academicYear.match(/\d{4}/);
      if (yearMatch) {
        dateQuery.year = Number(yearMatch[0]);
      }
    }

    const assessments = await Assessment.find({
      school: schoolId,
      student: studentId,
      ...dateQuery,
    }).populate("subject", "name");

    const bySubject = new Map();
    for (const a of assessments) {
      if (!a.subject) continue;
      const key = a.subject._id.toString();
      if (!bySubject.has(key)) {
        bySubject.set(key, { subjectId: key, subjectName: a.subject.name, caPercents: [], examPercents: [] });
      }
      const bucket = bySubject.get(key);
      const maxScore = a.maxScore || 100;
      const percentage = maxScore > 0 ? (a.score / maxScore) * 100 : 0;
      if (EXAM_TYPES.includes(a.assessmentType)) {
        bucket.examPercents.push(percentage);
      } else {
        bucket.caPercents.push(percentage);
      }
    }

    const subjects = Array.from(bySubject.values()).map((s) => {
      const caPercentAvg = average(s.caPercents);
      const examPercentAvg = average(s.examPercents);
      const continuousAssess = caPercentAvg !== null ? round1((caPercentAvg / 100) * CA_MAX_MARKS) : null;
      const testScore = examPercentAvg !== null ? round1((examPercentAvg / 100) * EXAM_MAX_MARKS) : null;
      const total = continuousAssess !== null || testScore !== null ? round1((continuousAssess || 0) + (testScore || 0)) : null;
      return {
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        continuousAssess,
        testScore,
        total,
        assessmentCount: s.caPercents.length + s.examPercents.length,
      };
    });

    return NextResponse.json({ success: true, subjects, usedCalendarWindow }, { status: 200 });
  } catch (error) {
    console.error("[ReportCards AssessmentSummary GET Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
