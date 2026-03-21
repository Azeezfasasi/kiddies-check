import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import SchoolMember from "@/app/server/models/SchoolMember.js";
import Class from "@/app/server/models/Class.js";

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
        role: { $in: ["school-leader", "admin"] },
        status: "active",
      });

      // Allow access if user is in SchoolMember as school-leader/admin, or has school-leader/admin role globally
      const isAdmin = user.role === "admin";
      const isSchoolLeader = user.role === "school-leader";
      const hasSchoolAccess = !!userAccess;

      if (!hasSchoolAccess && !isAdmin && !isSchoolLeader) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      // Fetch all stats in parallel
      const [
        schoolLeadersCount,
        teachersCount,
        studentsCount,
        parentsCount,
        staffCount,
        classesCount,
      ] = await Promise.all([
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: "school-leader",
          status: "active",
        }),
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: "teacher",
          status: "active",
        }),
        SchoolMember.countDocuments({
          school: schoolObjectId,
          role: "student",
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
      ]);

      const totalStaff = schoolLeadersCount + teachersCount + staffCount;

      const stats = {
        schoolLeaders: schoolLeadersCount,
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
