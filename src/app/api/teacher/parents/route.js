import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const search = req.nextUrl.searchParams.get("search") || "";

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const allowedRoles = ['admin', 'learning-specialist', 'school-leader', 'teacher'];
    if (!allowedRoles.includes(user.role)) {
      return Response.json({ error: "Unauthorized to view parents" }, { status: 403 });
    }

    // Check school access for non-admin users
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasSchoolAccess = 
        (user?.schoolId && user.schoolId.toString() === schoolId) || 
        (user?.managedSchools && user.managedSchools.some(s => s.toString() === schoolId));
      
      if (!hasSchoolAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    // Find parents (users with role 'parent') 
    // For flexibility, allow searching in all users and let the role filter them
    const parents = await User.find({
      role: "parent",
      isActive: true,
      ...searchQuery,
    })
      .select("firstName lastName email phone avatar role")
      .limit(50);

    return Response.json({ parents }, { status: 200 });
  } catch (error) {
    console.error("[Get Parents Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
