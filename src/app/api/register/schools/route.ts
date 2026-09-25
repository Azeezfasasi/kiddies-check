import { connectDB } from "@/utils/db";
import School from "@/app/server/models/School";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/register/schools - Fetch active schools for registration (public endpoint)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const schoolType = searchParams.get("schoolType") || "my-childs-school";

    // Build query - only show active and approved schools
    const query: Record<string, unknown> = {
      isActive: true,
      approvalStatus: "approved",
    };

    // Filter by school type if provided and not "all"
    // Include schools without schoolType to handle legacy data
    if (schoolType && schoolType !== "all") {
      query.$or = [
        { schoolType: schoolType },
        { schoolType: { $exists: false } },  // Include schools without schoolType
      ];
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
