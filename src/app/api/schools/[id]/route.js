import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { Types } from "mongoose";
import School from "@/app/server/models/School.js";
import { NextResponse } from "next/server";

// PUT /api/schools/:id - Update a school
export async function PUT(req, { params }) {
  return authenticate(req, async (user) => {
    try {
      await connectDB();

      // Verify admin access
      if (user.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can update schools" },
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

      const school = await School.findById(id);
      if (!school) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      const body = await req.json();
      const { name, email, phone, location, model, website, description, schoolType } =
        body;

      // Check if email is being changed and if new email exists
      if (email && email.toLowerCase() !== school.email.toLowerCase()) {
        const existingSchool = await School.findOne({
          email: email.toLowerCase(),
          _id: { $ne: id },
        });
        if (existingSchool) {
          return NextResponse.json(
            { error: "Email already in use by another school" },
            { status: 400 }
          );
        }
      }

      // Update fields
      if (name) school.name = name;
      if (email) school.email = email.toLowerCase();
      if (phone !== undefined) school.phone = phone;
      if (location !== undefined) school.location = location;
      if (model !== undefined) school.model = model;
      if (website !== undefined) school.website = website;
      if (description !== undefined) school.description = description;
      if (schoolType !== undefined) school.schoolType = schoolType;

      school.updatedAt = new Date();
      await school.save();

      return NextResponse.json(
        {
          success: true,
          message: "School updated successfully",
          school,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("School update error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to update school",
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/schools/:id - Delete a school
export async function DELETE(req, { params }) {
  return authenticate(req, async (user) => {
    try {
      await connectDB();

      // Verify admin access
      if (user.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can delete schools" },
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

      const school = await School.findByIdAndDelete(id);
      if (!school) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "School deleted successfully",
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("School deletion error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to delete school",
        },
        { status: 500 }
      );
    }
  });
}
