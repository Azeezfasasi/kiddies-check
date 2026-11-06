import type { NextRequest } from "next/server";
import { verifiedUserId } from "@/app/server/lib/requireAccess";
import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import "@/app/server/models/Class";
import "@/app/server/models/School";
import { connectDB } from "@/utils/db";

export async function GET(req: NextRequest) {
  try {
    const userId = await verifiedUserId(req);
    const schoolId = req.nextUrl.searchParams.get("schoolId");

    if (!userId) {
      return Response.json({ error: "User information required" }, { status: 401 });
    }

    // Verify user is a parent
    const user = await User.findById(userId);

    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    if (user.role !== "parent") {
      return Response.json({ error: "Only parents can access this resource" }, { status: 403 });
    }

    await connectDB();

    // All children assigned to this parent, across every school; pass schoolId to limit to one school
    const filter: Record<string, unknown> = { parent: userId, isActive: true };
    if (schoolId && schoolId !== "null" && schoolId !== "undefined") filter.school = schoolId;

    const students = await Student.find(filter)
      .populate("class", "name level section")
      .populate("school", "name logo")
      .populate("parent", "firstName lastName email phone avatar")
      .sort({ firstName: 1, lastName: 1 });

    return Response.json({ students }, { status: 200 });
  } catch (error) {
    console.error("[Get Parent Students Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
