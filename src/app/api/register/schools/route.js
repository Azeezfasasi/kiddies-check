import { connectDB } from "@/utils/db.js";
import School from "@/app/server/models/School.js";
import { NextResponse } from "next/server";

// GET /api/register/schools - Fetch active schools for registration (public endpoint)
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const schoolType = searchParams.get("schoolType") || "my-childs-school";

    // Build query - only show active and approved schools
    const query = {
      isActive: true,
      approvalStatus: "approved",
    };

    // Filter by school type if provided
    if (schoolType && schoolType !== "all") {
      query.schoolType = schoolType;
    }

    // Fetch schools with minimal required fields
    const schools = await School.find(query)
      .select("_id name location model schoolType")
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: schools,
    });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}
