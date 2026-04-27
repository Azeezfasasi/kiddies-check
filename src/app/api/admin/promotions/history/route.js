/**
 * /api/admin/promotions/history
 * Promotion history (admin only)
 */

import { connectDB } from "@/app/server/db/connect";
import PromotionRecord from "@/app/server/models/PromotionRecord";
import User from "@/app/server/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const verifyAdmin = async (req) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Unauthorized: Invalid token", status: 401 };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user || !["admin", "learning-specialist"].includes(user.role)) {
      return { error: "Forbidden: Admin access required", status: 403 };
    }

    return { user };
  } catch (error) {
    return { error: "Unauthorized: Invalid token", status: 401 };
  }
};

/**
 * GET /api/admin/promotions/history
 * Query: ?schoolId=&academicSession=&classId=&page=&limit=
 */
export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const academicSession = searchParams.get("academicSession");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query = {};
    if (schoolId) query.school = schoolId;
    if (academicSession) query.academicSession = academicSession;
    if (status) query.status = status;
    if (classId) {
      query.$or = [{ fromClass: classId }, { toClass: classId }];
    }

    await connectDB();

    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      PromotionRecord.find(query)
        .populate("student", "firstName lastName enrollmentNo")
        .populate("fromClass", "name level section")
        .populate("toClass", "name level section")
        .populate("promotedBy", "firstName lastName email")
        .populate("school", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PromotionRecord.countDocuments(query),
    ]);

    // Get distinct academic sessions for filter dropdown
    const sessions = await PromotionRecord.distinct("academicSession", schoolId ? { school: schoolId } : {});

    return Response.json(
      {
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        sessions: sessions.sort().reverse(),
        records,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching promotion history:", error);
    return Response.json(
      { success: false, message: "Failed to fetch promotion history", error: error.message },
      { status: 500 }
    );
  }
}

