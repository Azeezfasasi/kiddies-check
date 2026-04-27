/**
 * /api/admin/academic-calendar
 * Global academic calendar management (admin only)
 */

import { connectDB } from "@/app/server/db/connect";
import AcademicCalendar from "@/app/server/models/AcademicCalendar";
import User from "@/app/server/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper: verify admin token
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
 * GET /api/admin/academic-calendar
 * List all academic calendar terms
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
    const session = searchParams.get("session");
    const isCurrent = searchParams.get("isCurrent");

    const query = {};
    if (session) query.session = session;
    if (isCurrent !== null) query.isCurrent = isCurrent === "true";

    const terms = await AcademicCalendar.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("updatedBy", "firstName lastName email")
      .sort({ session: -1, term: 1 });

    return Response.json(
      { success: true, count: terms.length, terms },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching academic calendar:", error);
    return Response.json(
      { success: false, message: "Failed to fetch academic calendar", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/academic-calendar
 * Create a new academic term
 */
export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { session, term, startDate, endDate, holidays, isCurrent } = body;

    if (!session || !term || !startDate || !endDate) {
      return Response.json(
        { success: false, message: "session, term, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return Response.json(
        { success: false, message: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check for duplicate session + term
    const existing = await AcademicCalendar.findOne({ session, term });
    if (existing) {
      return Response.json(
        { success: false, message: `Term '${term}' for session '${session}' already exists` },
        { status: 409 }
      );
    }

    const newTerm = await AcademicCalendar.create({
      session,
      term,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      holidays: holidays || [],
      isCurrent: isCurrent || false,
      createdBy: auth.user._id,
      updatedBy: auth.user._id,
    });

    return Response.json(
      { success: true, message: "Academic term created successfully", term: newTerm },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating academic term:", error);
    return Response.json(
      { success: false, message: "Failed to create academic term", error: error.message },
      { status: 500 }
    );
  }
}

