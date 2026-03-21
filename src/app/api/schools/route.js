import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { Types } from "mongoose";
import School from "@/app/server/models/School.js";
import User from "@/app/server/models/User.js";
import { NextResponse } from "next/server";

// GET /api/schools - Fetch schools with search, filter, and pagination
export async function GET(req) {
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

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page")) || 1;
      const pageSize = parseInt(searchParams.get("pageSize")) || 10;
      const search = searchParams.get("search") || "";
      const isActive = searchParams.get("isActive");
      const approvalStatus = searchParams.get("approvalStatus");

      // Build query
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      if (isActive !== null && isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      if (approvalStatus && approvalStatus !== "all") {
        query.approvalStatus = approvalStatus;
      }

      // Execute query with pagination
      const totalCount = await School.countDocuments(query);
      const totalPages = Math.ceil(totalCount / pageSize);

      const schools = await School.find(query)
        .select(
          "name email phone location model logo website description numberOfStudents numberOfTeachers approvalStatus isActive createdAt principal"
        )
        .populate({
          path: "principal",
          select: "schoolLogo firstName lastName"
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean();

      return NextResponse.json(
        {
          success: true,
          schools,
          page,
          pageSize,
          totalCount,
          totalPages,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Schools fetch error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch schools",
          details: error.message,
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/schools - Create a new school
export async function POST(req) {
  return authenticate(req, async (user) => {
    try {
      await connectDB();

      // Verify admin access
      if (user.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can create schools" },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { name, email, phone, location, model, website, description } =
        body;

      if (!name || !email) {
        return NextResponse.json(
          { error: "Name and email are required" },
          { status: 400 }
        );
      }

      // Check if email already exists
      const existingSchool = await School.findOne({ email: email.toLowerCase() });
      if (existingSchool) {
        return NextResponse.json(
          { error: "School with this email already exists" },
          { status: 400 }
        );
      }

      const newSchool = new School({
        name,
        email: email.toLowerCase(),
        phone,
        location,
        model,
        website,
        description,
        isActive: true,
        approvalStatus: "approved", // Admin-created schools are auto-approved
        approvedAt: new Date(),
        approvedBy: user._id,
      });

      await newSchool.save();

      // Add school to admin's managedSchools
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { managedSchools: newSchool._id } },
        { new: true }
      );

      return NextResponse.json(
        {
          success: true,
          message: "School created successfully",
          school: newSchool,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("School creation error:", error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || "Failed to create school",
        },
        { status: 500 }
      );
    }
  });
}
