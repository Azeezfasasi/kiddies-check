import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import ExamQuestion from "@/app/server/models/ExamQuestion";
import User from "@/app/server/models/User";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const { id } = await params;

    if (!userId || !id) {
      return NextResponse.json({ success: false, message: "User and exam id required" }, { status: 400 });
    }

    await connectDB();

    const exam = await Exam.findById(id).populate("class", "name").populate("subject", "name");
    if (!exam) {
      return NextResponse.json({ success: false, message: "Exam not found" }, { status: 404 });
    }

    const user = await User.findById(userId);
    if (!user || !(await canAccessSchool(user, exam.school.toString()))) {
      return NextResponse.json({ success: false, message: "Access denied" }, { status: 403 });
    }

    const attempts = await ExamAttempt.find({ exam: id })
      .populate("student", "firstName lastName enrollmentNo")
      .sort({ score: -1 });

    // Full question + correct-answer detail so staff can review what each student answered.
    const questions = await ExamQuestion.find({ exam: id }).sort({ order: 1 });

    return NextResponse.json({ success: true, exam, attempts, questions }, { status: 200 });
  } catch (error) {
    console.error("[Exam Results Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
