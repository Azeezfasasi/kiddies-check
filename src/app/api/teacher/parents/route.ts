import type { NextRequest } from "next/server";
import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";
import Student from "@/app/server/models/Student";
import { connectDB } from "@/utils/db";
import { Types } from "mongoose";
import { isAcademicAdmin, withFeature } from "@/utils/roles";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const search = req.nextUrl.searchParams.get("search") || "";

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Connect to database FIRST, before any queries
    await connectDB();

    // Verify user access
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedRoles = withFeature(['admin', 'learning-specialist', 'school-leader', 'teacher'], "academics");
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: "Unauthorized to view parents" }, { status: 403 });
    }

    // Check school access for non-admin users
    if (!isAcademicAdmin(user.role, "view")) {
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(s => s.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Build search query
    let searchQuery = {};
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      searchQuery = {
        $or: [
          { firstName: { $regex: escaped, $options: "i" } },
          { lastName: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
          { phone: { $regex: escaped, $options: "i" } },
        ],
      };
    }

    // A school's parents are everyone invited to it as a parent (pending or accepted)
    // plus anyone linked as the parent of one of its pupils. Count each account once.
    const [memberships, linkedParentIds] = await Promise.all([
      SchoolMember.find({ school: schoolId, role: "parent", status: { $ne: "removed" } })
        .select("user status invitedAt acceptedAt")
        .lean(),
      Student.find({ school: schoolId, parent: { $ne: null } }).distinct("parent"),
    ]);

    const membershipByUser = new Map(
      memberships.filter((m) => m.user).map((m) => [String(m.user), m])
    );
    const parentIds = [...new Set([...membershipByUser.keys(), ...linkedParentIds.map(String)])];

    const objectIds = parentIds.map((id) => new Types.ObjectId(id));
    const [users, childCounts] = await Promise.all([
      User.find({ _id: { $in: objectIds }, ...searchQuery })
        .select("firstName lastName email phone avatar role isActive createdAt")
        .lean(),
      // Active pupils per parent, so the page doesn't need a request per parent
      Student.aggregate([
        { $match: { school: new Types.ObjectId(schoolId), isActive: true, parent: { $in: objectIds } } },
        { $group: { _id: "$parent", count: { $sum: 1 } } },
      ]),
    ]);
    const childCountByParent = new Map(childCounts.map((c) => [String(c._id), c.count]));

    const parents = users.map((u) => {
      const membership = membershipByUser.get(String(u._id));
      return {
        ...u,
        childrenCount: childCountByParent.get(String(u._id)) ?? 0,
        memberStatus: membership?.status ?? null,
        invitedAt: membership?.invitedAt ?? null,
        acceptedAt: membership?.acceptedAt ?? null,
      };
    });

    return Response.json({ parents }, { status: 200 });
  } catch (error) {
    console.error("[Get Parents Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
