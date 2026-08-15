import Student from "@/app/server/models/Student";
import ExamAttempt from "@/app/server/models/ExamAttempt";
import User from "@/app/server/models/User";
import Exam from "@/app/server/models/Exam";
import Subject from "@/app/server/models/Subject";
import Class from "@/app/server/models/Class";
import { connectDB } from "@/utils/db";

// GET /api/parent/exam-results?schoolId= — a parent's own children's graded CBT exam
// attempts, mirroring the scoping used by /api/parent/students.
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

    if (!userId || !schoolId || schoolId === "null" || schoolId === "undefined") {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
    if (user.role !== "parent") {
      return Response.json({ error: "Only parents can access this resource" }, { status: 403 });
    }

    await connectDB();

    const children = await Student.find({ parent: userId, school: schoolId, isActive: true }).select("_id");
    if (!children.length) {
      return Response.json({ results: [] }, { status: 200 });
    }

    const attempts = await ExamAttempt.find({
      student: { $in: children.map((c) => c._id) },
      school: schoolId,
      status: "graded",
    })
      .populate("student", "firstName lastName")
      .populate({
        path: "exam",
        select: "title term academicYear totalMarks subject class",
        populate: [
          { path: "subject", select: "name" },
          { path: "class", select: "name" },
        ],
      })
      .sort({ submittedAt: -1 });

    return Response.json({ results: attempts }, { status: 200 });
  } catch (error) {
    console.error("[Parent Exam Results Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
