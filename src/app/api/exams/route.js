import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import Class from "@/app/server/models/Class";
import Subject from "@/app/server/models/Subject";
import User from "@/app/server/models/User";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const classId = req.nextUrl.searchParams.get("classId") || "";
    const subjectId = req.nextUrl.searchParams.get("subjectId") || "";
    const status = req.nextUrl.searchParams.get("status") || "";
    const search = req.nextUrl.searchParams.get("search") || "";

    if (!userId || !schoolId) {
      return NextResponse.json({ success: false, message: "User and school information required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, schoolId))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const query = { school: schoolId };
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (status) query.status = status;
    if (search) query.title = { $regex: escapeRegex(search), $options: "i" };

    const exams = await Exam.find(query)
      .populate("class", "name level section")
      .populate("subject", "name")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, exams }, { status: 200 });
  } catch (error) {
    console.error("[Exams GET Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { schoolId, classId, subjectId, title, term, academicYear, durationMinutes, instructions, questions } = body;

    if (!userId || !schoolId || !classId || !subjectId || !title || !term || !academicYear || !durationMinutes) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const questionError = validateQuestions(questions);
    if (questionError) {
      return NextResponse.json({ success: false, message: questionError }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, schoolId))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const schoolClass = await Class.findOne({ _id: classId, school: schoolId });
    if (!schoolClass) {
      return NextResponse.json({ success: false, message: "Class not found in this school" }, { status: 404 });
    }

    const subject = await Subject.findOne({ _id: subjectId, school: schoolId });
    if (!subject) {
      return NextResponse.json({ success: false, message: "Subject not found in this school" }, { status: 404 });
    }

    const totalMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

    const exam = await Exam.create({
      school: schoolId,
      class: classId,
      subject: subjectId,
      title,
      term,
      academicYear,
      createdBy: userId,
      durationMinutes,
      totalMarks,
      instructions: instructions || "",
      status: "draft",
    });

    await ExamQuestion.insertMany(
      questions.map((q, index) => ({
        exam: exam._id,
        order: index,
        text: q.text,
        type: q.type === "true-false" ? "true-false" : "single-choice",
        options: q.options.map((o) => ({ text: o.text, isCorrect: Boolean(o.isCorrect) })),
        marks: Number(q.marks) || 1,
      }))
    );

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error("[Exams POST Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
