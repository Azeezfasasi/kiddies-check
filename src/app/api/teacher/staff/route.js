import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";
import { connectDB } from "@/utils/db";
import { Types } from "mongoose";

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

    console.log("[Staff API] Fetching staff for userId:", userId, "schoolId:", schoolId);

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    await connectDB();

    // Verify user has access to this school
    const user = await User.findById(userId);
    
    if (!user) {
      console.log("[Staff API] User not found");
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Convert schoolId to ObjectId for consistent querying
    let schoolObjectId;
    try {
      schoolObjectId = new Types.ObjectId(schoolId);
    } catch (err) {
      console.log("[Staff API] Invalid schoolId format:", schoolId);
      return Response.json({ error: "Invalid school ID format" }, { status: 400 });
    }

    // Allow admin and learning-specialist full access to any school
    let hasSchoolAccess = ['admin', 'learning-specialist'].includes(user.role);

    // If not admin/learning-specialist, check schoolId or SchoolMember
    if (!hasSchoolAccess) {
      // Check User model for schoolId
      if (user.schoolId && user.schoolId.toString() === schoolId) {
        console.log("[Staff API] Access granted via User.schoolId");
        hasSchoolAccess = true;
      } else if (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId)) {
        console.log("[Staff API] Access granted via User.managedSchools");
        hasSchoolAccess = true;
      } else {
        // Check SchoolMember for teachers, school-leaders, etc.
        const schoolMemberAccess = await SchoolMember.findOne({
          user: userId,
          school: schoolObjectId,
          status: "active",
        });
        if (schoolMemberAccess) {
          console.log("[Staff API] Access granted via SchoolMember");
          hasSchoolAccess = true;
        } else {
          console.log("[Staff API] No SchoolMember found for user in school");
        }
      }
    } else {
      console.log("[Staff API] Access granted via admin/learning-specialist role");
    }

    if (!hasSchoolAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch teachers and school leaders through SchoolMember
    console.log("[Staff API] Fetching staff from SchoolMember for school:", schoolObjectId.toString());
    
    // First, let's see what SchoolMembers exist in this school
    const allMembers = await SchoolMember.find({
      school: schoolObjectId,
    }).select("user role status");
    console.log("[Staff API] All SchoolMembers in school:", allMembers.length);
    allMembers.forEach(m => {
      console.log(`  - User: ${m.user}, Role: ${m.role}, Status: ${m.status}`);
    });

    const schoolMembers = await SchoolMember.find({
      school: schoolObjectId,
      role: { $in: ["teacher", "school-leader"] },
      status: "active",
    }).populate("user", "_id firstName lastName email");

    console.log("[Staff API] Found", schoolMembers.length, "staff members (role in teacher/school-leader, status=active)");

    // Map to include user data
    const staff = schoolMembers
      .filter(member => member.user) // Ensure user data exists
      .map(member => ({
        _id: member.user._id,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        role: member.role,
      }));

    console.log("[Staff API] Returning", staff.length, "staff members");
    return Response.json({ staff }, { status: 200 });
  } catch (error) {
    console.error("[Staff Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
