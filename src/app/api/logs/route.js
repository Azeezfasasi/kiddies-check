import { NextResponse } from "next/server";
import { connectDB } from "@/app/server/db/connect";
import LoginLog from "@/app/server/models/LoginLog";
import ActivityLog from "@/app/server/models/ActivityLog";
import IssueReport from "@/app/server/models/IssueReport";
import User from "@/app/server/models/User";

/**
 * GET /api/logs
 * Fetch all logs (logins, activities, issues)
 * Query params: type (login/activity/issue/all), school, limit, offset, sortBy
 */
export async function GET(req) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const type = req.nextUrl.searchParams.get("type") || "all"; // login, activity, issue, all
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "-timestamp"; // -timestamp or -loginTime
    const days = parseInt(req.nextUrl.searchParams.get("days") || "7"); // Last N days

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 401 }
      );
    }

    // Verify user is admin or school-leader
    const user = await User.findById(userId);
    if (!user || !["admin", "school-leader"].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const dateRange = {
      $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    };

    const query = schoolId ? { school: schoolId } : {};
    let results = {
      loginLogs: [],
      activityLogs: [],
      issueLogs: [],
      total: 0,
    };

    // Fetch login logs
    if (["login", "all"].includes(type)) {
      const loginQuery = {
        ...query,
        loginTime: dateRange,
      };
      const loginLogs = await LoginLog.find(loginQuery)
        .sort(sortBy === "-timestamp" ? "-loginTime" : sortBy)
        .limit(limit)
        .skip(offset)
        .lean();

      const loginTotal = await LoginLog.countDocuments(loginQuery);
      results.loginLogs = loginLogs;
      results.loginTotal = loginTotal;
    }

    // Fetch activity logs
    if (["activity", "all"].includes(type)) {
      const activityQuery = {
        ...query,
        timestamp: dateRange,
      };
      const activityLogs = await ActivityLog.find(activityQuery)
        .sort(sortBy)
        .limit(limit)
        .skip(offset)
        .populate("user", "firstName lastName email")
        .lean();

      const activityTotal = await ActivityLog.countDocuments(activityQuery);
      results.activityLogs = activityLogs;
      results.activityTotal = activityTotal;
    }

    // Fetch issue reports
    if (["issue", "all"].includes(type)) {
      const issueQuery = {
        ...query,
        reportedAt: dateRange,
      };
      const issues = await IssueReport.find(issueQuery)
        .sort(sortBy === "-timestamp" ? "-reportedAt" : sortBy)
        .limit(limit)
        .skip(offset)
        .populate("user", "firstName lastName email")
        .populate("assignedTo", "firstName lastName email")
        .lean();

      const issueTotal = await IssueReport.countDocuments(issueQuery);
      results.issueLogs = issues;
      results.issueTotal = issueTotal;
    }

    results.total =
      (results.loginTotal || 0) +
      (results.activityTotal || 0) +
      (results.issueTotal || 0);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    console.error("[Logs API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/logs/activity
 * Create an activity log entry
 */
export async function POST(req) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      action,
      entityType,
      entityId,
      entityName,
      description,
      changes,
      status = "success",
      errorMessage,
    } = await req.json();

    if (!action || !entityType) {
      return NextResponse.json(
        { error: "action and entityType are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activityLog = await ActivityLog.create({
      user: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userRole: user.role,
      school: user.schoolId,
      schoolName: user.schoolName,
      action,
      entityType,
      entityId,
      entityName,
      description,
      changes,
      status,
      errorMessage,
    });

    return NextResponse.json(
      { success: true, data: activityLog },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Activity Log POST Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
