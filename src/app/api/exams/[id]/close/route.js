import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import User from "@/app/server/models/User";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
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

    if (exam.status !== "published") {
      return NextResponse.json({ success: false, message: "Only a published exam can be closed" }, { status: 409 });
    }

    exam.status = "closed";
    await exam.save();

    return NextResponse.json({ success: true, exam }, { status: 200 });
  } catch (error) {
    console.error("[Exam Close Error]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
