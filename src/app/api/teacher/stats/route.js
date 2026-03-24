import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import Class from "@/app/server/models/Class.js";
import Subject from "@/app/server/models/Subject.js";
import Assessment from "@/app/server/models/Assessment.js";
import Student from "@/app/server/models/Student.js";
import SchoolMember from "@/app/server/models/SchoolMember.js";

// GET /api/teacher/stats
// Fetch teacher statistics for their teaching activities
export async function GET(req) {
  return authenticate(req, async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get("schoolId");

      if (!schoolId) {
        return NextResponse.json(
          { error: "School ID is required" },
          { status: 400 }
        );
      }

      await connectDB();

      // Convert schoolId string to ObjectId for consistent database queries
      const schoolObjectId = new Types.ObjectId(schoolId);

      // Verify teacher access: check if user is a teacher in this school
      const isTeacherInSchool = await SchoolMember.findOne({
        user: user._id,
        school: schoolObjectId,
        role: "teacher",
        status: "active",
      });

      // Also allow if user is an admin/learning-specialist/teacher with school management access
      const hasManagementAccess =
        user &&
        ((user.role === "admin" || user.role === "learning-specialist") ||
          (user.schoolId && user.schoolId.toString() === schoolId) ||
          (user.managedSchools &&
            user.managedSchools.some((id) => id.toString() === schoolId)));

      const hasAccess = isTeacherInSchool || hasManagementAccess;

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get all classes taught by this teacher
      const classes = await Class.find({
        teacher: user._id,
        school: schoolObjectId,
      }).lean();

      const classIds = classes.map((c) => c._id);

      // Fetch stats in parallel
      const [studentsInClasses, subjectsTeaching, assessmentsCreated] =
        await Promise.all([
          Student.countDocuments({ class: { $in: classIds } }),
          Subject.countDocuments({ school: schoolObjectId, teacher: user._id }),
          Assessment.countDocuments({ teacher: user._id, school: schoolObjectId }),
        ]);

      // Calculate assessment rate (ratio of students assessed)
      const totalStudents = studentsInClasses || 1; // Avoid division by zero
      const assessmentRate =
        totalStudents > 0 ? ((assessmentsCreated / totalStudents) * 100).toFixed(2) : 0;

      const stats = {
        totalStudents: studentsInClasses,
        classesTeaching: classes.length,
        subjectsTeaching: subjectsTeaching,
        assessmentsCreated: assessmentsCreated,
        assessmentRate: parseFloat(assessmentRate),
      };

      return NextResponse.json(
        {
          success: true,
          stats,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Teacher stats error:", error);
      return NextResponse.json(
        { error: "Failed to fetch teacher statistics", details: error.message },
        { status: 500 }
      );
    }
  });
}
