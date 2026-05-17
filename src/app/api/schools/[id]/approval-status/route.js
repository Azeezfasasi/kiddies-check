import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { Types } from "mongoose";
import School from "@/app/server/models/School.js";
import { NextResponse } from "next/server";

// PATCH /api/schools/:id/approval-status - Update school approval status
export async function PATCH(req, { params }) {
  return authenticate(req, async (user) => {
    try {
      await connectDB();

      // Verify admin or learning specialist access
      if (user.role !== "admin" && user.role !== "learning-specialist") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      const { id } = await params;

      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid school ID" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { approvalStatus } = body;

      // Validate approval status
      const validStatuses = ["pending", "approved", "rejected"];
      if (!approvalStatus || !validStatuses.includes(approvalStatus)) {
        return NextResponse.json(
          { error: "Invalid approval status. Must be one of: pending, approved, rejected" },
          { status: 400 }
        );
      }

      const school = await School.findByIdAndUpdate(
        id,
        {
          approvalStatus,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!school) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `School approval status updated to ${approvalStatus}`,
          school,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("School approval status update error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to update school approval status",
        },
        { status: 500 }
      );
    }
  });
}
