import { withAudit } from "@/app/server/lib/audit";
import { verifiedUserId } from "@/app/server/lib/requireAccess";
import { type NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import Exam from "@/app/server/models/Exam";
import User from "@/app/server/models/User";
import { canAccessSchool } from "@/app/server/lib/schoolAccess";

async function putHandler(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await verifiedUserId(req);
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
      return NextResponse.json({ success: false, message: "Access denied: You are not authorized to access this exam" }, { status: 403 });
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

export const PUT = withAudit(putHandler);
