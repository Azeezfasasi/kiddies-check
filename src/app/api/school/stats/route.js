import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import SchoolMember from "@/app/server/models/SchoolMember.js";
import Class from "@/app/server/models/Class.js";
import Student from "@/app/server/models/Student.js";
import User from "@/app/server/models/User.js";

// GET /api/school/stats
// Fetch school statistics for school leaders/admins
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

      // Verify access: user must be school leader/admin in this school
      const userAccess = await SchoolMember.findOne({
        user: user._id,
        school: schoolObjectId,
        role: { $in: ["school-leader", "admin", "learning-specialist"] },
        status: "active",
      });

      // Allow access if user is in SchoolMember as school-leader/admin, or has school-leader/admin role globally
      const isAdmin = user.role === "admin";
      const isSchoolLeader = user.role === "school-leader";
      const isLearningSpecialist = user.role === "learning-specialist";
      const hasSchoolAccess = !!userAccess;

      if (!hasSchoolAccess && !isAdmin && !isSchoolLeader && !isLearningSpecialist) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      // Fetch all stats in parallel
      // Count members and classes. Students are stored in the `Student` collection,
      // not in `SchoolMember`, so count students from the Student model.
      const [
        schoolLeadersCount,
        teachersCount,
        parentsCount,
        staffCount,
        classesCount,
        studentsCount,
      ] = await Promise.all([
        // Treat school leaders and learning specialists as leadership for stats
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: { $in: ["school-leader", "learning-specialist"] },
          status: "active",
        }),
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: "teacher",
          status: "active",
        }),
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: "parent",
          status: "active",
        }),
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: "staff",
          status: "active",
        }),
        Class.countDocuments({ school: schoolObjectId }),
        Student.countDocuments({ school: schoolObjectId, isActive: true }),
      ]);

      // If there are no SchoolMember entries for school leaders, fall back to counting
      // users with role 'school-leader' who have the schoolId set (legacy data may use User.schoolId).
      let effectiveSchoolLeaders = schoolLeadersCount;
      if (!effectiveSchoolLeaders) {
        try {
          const fallbackLeaders = await User.countDocuments({
            role: { $in: ["school-leader", "learning-specialist"] },
            schoolId: schoolObjectId,
          });
          effectiveSchoolLeaders = fallbackLeaders;
        } catch (e) {
          // ignore fallback errors and keep original count
          console.warn("School leaders fallback count failed:", e.message);
        }
      }

      const totalStaff = effectiveSchoolLeaders + teachersCount + staffCount;

      const stats = {
        schoolLeaders: effectiveSchoolLeaders,
        teachers: teachersCount,
        students: studentsCount,
        parents: parentsCount,
        classes: classesCount,
        totalStaff: totalStaff,
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
      console.error("School stats error:", error);
      return NextResponse.json(
        { error: "Failed to fetch school statistics", details: error.message },
        { status: 500 }
      );
    }
  });
}
