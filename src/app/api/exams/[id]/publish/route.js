import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import User from "@/app/server/models/User";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";

// Avoids visually ambiguous characters (0/O, 1/I) since the code is read aloud/copied by children.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateAccessCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json().catch(() => ({}));
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
      return NextResponse.json({ success: false, message: "Only a draft exam can be published" }, { status: 409 });
    }

    const questionCount = await ExamQuestion.countDocuments({ exam: id });
    if (questionCount === 0) {
      return NextResponse.json({ success: false, message: "Add at least one question before publishing" }, { status: 400 });
    }

    exam.status = "published";
    exam.accessCode = generateAccessCode();
    exam.availableFrom = body.availableFrom ? new Date(body.availableFrom) : new Date();
    exam.availableUntil = body.availableUntil ? new Date(body.availableUntil) : null;

    await exam.save();

    return NextResponse.json({ success: true, exam }, { status: 200 });
  } catch (error) {
    console.error("[Exam Publish Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
