import { NextResponse } from "next/server";
import { connectDB } from "@/app/server/db/connect";
import LoginLog from "@/app/server/models/LoginLog";
import User from "@/app/server/models/User";

/**
 * POST /api/logs/login
 * Create a login log entry
 */
export async function POST(req) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      email,
      firstName,
      lastName,
      userRole,
      school,
      schoolName,
      status = "success",
      failureReason,
      userAgent,
      deviceType,
    } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get IP address from request (if available)
    const ipAddress =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      req.socket?.remoteAddress ||
      "unknown";

    const loginLog = await LoginLog.create({
      user: userId,
      email,
      firstName,
      lastName,
      userRole,
      school,
      schoolName,
      status,
      failureReason,
      userAgent,
      deviceType,
      ipAddress: ipAddress.split(",")[0].trim(), // Get first IP if multiple
    });

    return NextResponse.json(
      { success: true, data: loginLog },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Login Log POST Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
