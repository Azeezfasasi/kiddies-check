import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

    if (!userId || !schoolId || schoolId === "null" || schoolId === "undefined") {
      return Response.json({ error: "User and school information required" }, { status: 401 });
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

    // Find all students assigned to this parent
    const students = await Student.find({ 
      parent: userId, 
      school: schoolId,
      isActive: true 
    })
      .populate("class", "name level section")
      .populate("parent", "firstName lastName email phone avatar")
      .sort({ firstName: 1, lastName: 1 });

    return Response.json({ students }, { status: 200 });
  } catch (error) {
    console.error("[Get Parent Students Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
