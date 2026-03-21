import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { Types } from "mongoose";
import School from "@/app/server/models/School.js";
import { NextResponse } from "next/server";

// PATCH /api/schools/:id/status - Toggle school active status
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

      const { id } = params;

      if (!Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: "Invalid school ID" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const { isActive } = body;

      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be a boolean" },
          { status: 400 }
        );
      }

      const school = await School.findByIdAndUpdate(
        id,
        {
          isActive,
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
          message: `School is now ${isActive ? "active" : "inactive"}`,
          school,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("School status update error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to update school status",
        },
        { status: 500 }
      );
    }
  });
}
