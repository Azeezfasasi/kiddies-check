import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import User from "@/app/server/models/User.js";
import Blog from "@/app/server/models/Blog.js";
import Contact from "@/app/server/models/Contact.js";
import Quote from "@/app/server/models/Quote.js";
import Project from "@/app/server/models/Project.js";
import SchoolMember from "@/app/server/models/SchoolMember.js";
import Student from "@/app/server/models/Student.js";
import { connectDB } from "@/app/server/db/connect.js";
import { NextResponse } from "next/server";

// GET /api/dashboard/stats
// Fetch aggregated statistics from all collections
export async function GET(req) {
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      try {
        await connectDB();
        const schoolId = req.nextUrl.searchParams.get("schoolId");
        let schoolUserFilter = {};

        if (schoolId) {
          const schoolMembers = await SchoolMember.find({ school: schoolId, status: "active" }).select("user");
          const memberUserIds = schoolMembers.map((member) => member.user);
          schoolUserFilter = { $or: [{ schoolId }, { _id: { $in: memberUserIds } }] };
        }

        const scopedUserFilter = (extra = {}) => ({ ...extra, ...schoolUserFilter });
        const scopedMemberFilter = schoolId ? { school: schoolId, status: "active" } : { status: "active" };

        // Fetch counts from all collections in parallel
        const [
          totalUsers,
          blogsCount,
          contactsCount,
          quotesCount,
          projectsCount,
          schoolLeadersCount,
          learningSpecialistCount,
          teachersCount,
          parentsCount,
          adminCount,
          studentsCount,
        ] = await Promise.all([
          User.countDocuments(scopedUserFilter({ isActive: true })),
          Blog.countDocuments({ status: "published" }),
          Contact.countDocuments(),
          Quote.countDocuments(),
          Project.countDocuments(),
          schoolId
            ? SchoolMember.countDocuments({ ...scopedMemberFilter, role: "school-leader" })
            : User.countDocuments({ role: "school-leader", isActive: true }),
          schoolId
            ? SchoolMember.countDocuments({ ...scopedMemberFilter, role: "learning-specialist" })
            : User.countDocuments({ role: "learning-specialist", isActive: true }),
          schoolId
            ? SchoolMember.countDocuments({ ...scopedMemberFilter, role: "teacher" })
            : SchoolMember.countDocuments({ role: "teacher", status: "active" }),
          schoolId
            ? SchoolMember.countDocuments({ ...scopedMemberFilter, role: "parent" })
            : User.countDocuments({ role: "parent", isActive: true }),
          schoolId
            ? SchoolMember.countDocuments({ ...scopedMemberFilter, role: "admin" })
            : User.countDocuments({ role: "admin", isActive: true }),
          schoolId ? Student.countDocuments({ school: schoolId, isActive: true }) : Student.countDocuments(),
        ]);

        // Count pending/open items
        const [pendingContacts, pendingQuotes] = await Promise.all([
          Contact.countDocuments({ status: "pending" }),
          Quote.countDocuments({ status: "pending" }),
        ]);

        const stats = {
          totalUsers,
          schoolLeaders: schoolLeadersCount,
          learningSpecialists: learningSpecialistCount,
          teachers: teachersCount,
          parents: parentsCount,
          admins: adminCount,
          students: studentsCount,
          blogs: blogsCount,
          contacts: contactsCount,
          requests: pendingQuotes + pendingContacts,
          pendingContacts,
          pendingQuotes,
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
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message,
          },
          { status: 500 }
        );
      }
    });
  });
}
