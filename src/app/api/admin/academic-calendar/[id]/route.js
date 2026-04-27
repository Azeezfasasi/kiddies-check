/**
 * /api/admin/academic-calendar/[id]
 * Single academic term operations (admin only)
 */

import { connectDB } from "@/app/server/db/connect";
import AcademicCalendar from "@/app/server/models/AcademicCalendar";
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
 * PUT /api/admin/academic-calendar/[id]
 * Update an academic term
 */
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { session, term, startDate, endDate, holidays, isActive, isCurrent } = body;

    await connectDB();

    const termDoc = await AcademicCalendar.findById(id);
    if (!termDoc) {
      return Response.json(
        { success: false, message: "Academic term not found" },
        { status: 404 }
      );
    }

    // Check duplicate if session/term changed
    if ((session && session !== termDoc.session) || (term && term !== termDoc.term)) {
      const duplicate = await AcademicCalendar.findOne({
        session: session || termDoc.session,
        term: term || termDoc.term,
        _id: { $ne: id },
      });
      if (duplicate) {
        return Response.json(
          { success: false, message: "Another term with this session and term already exists" },
          { status: 409 }
        );
      }
    }

    // Validate dates
    const newStart = startDate ? new Date(startDate) : termDoc.startDate;
    const newEnd = endDate ? new Date(endDate) : termDoc.endDate;
    if (newStart >= newEnd) {
      return Response.json(
        { success: false, message: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (session) termDoc.session = session;
    if (term) termDoc.term = term;
    if (startDate) termDoc.startDate = newStart;
    if (endDate) termDoc.endDate = newEnd;
    if (holidays !== undefined) termDoc.holidays = holidays;
    if (isActive !== undefined) termDoc.isActive = isActive;
    if (isCurrent !== undefined) termDoc.isCurrent = isCurrent;
    termDoc.updatedBy = auth.user._id;

    await termDoc.save();

    return Response.json(
      { success: true, message: "Academic term updated successfully", term: termDoc },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating academic term:", error);
    return Response.json(
      { success: false, message: "Failed to update academic term", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/academic-calendar/[id]
 * Delete an academic term
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    await connectDB();

    const termDoc = await AcademicCalendar.findByIdAndDelete(id);
    if (!termDoc) {
      return Response.json(
        { success: false, message: "Academic term not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, message: "Academic term deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting academic term:", error);
    return Response.json(
      { success: false, message: "Failed to delete academic term", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/academic-calendar/[id]
 * Set term as current (and unset others)
 */
export async function PATCH(request, { params }) {
  try {
    const auth = await verifyAdmin(request);
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const { id } = await params;

    await connectDB();

    const termDoc = await AcademicCalendar.findById(id);
    if (!termDoc) {
      return Response.json(
        { success: false, message: "Academic term not found" },
        { status: 404 }
      );
    }

    // Unset all others and set this one
    await AcademicCalendar.updateMany({ _id: { $ne: id } }, { $set: { isCurrent: false } });
    termDoc.isCurrent = true;
    termDoc.updatedBy = auth.user._id;
    await termDoc.save();

    return Response.json(
      { success: true, message: "Term set as current successfully", term: termDoc },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error setting current term:", error);
    return Response.json(
      { success: false, message: "Failed to set current term", error: error.message },
      { status: 500 }
    );
  }
}

