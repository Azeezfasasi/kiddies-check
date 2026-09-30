import { type NextRequest, NextResponse } from "next/server";
import { verifiedUserId } from "@/app/server/lib/requireAccess";
import { connectDB } from "@/app/server/db/connect";
import LoginLog from "@/app/server/models/LoginLog";
import ActivityLog from "@/app/server/models/ActivityLog";
import IssueReport from "@/app/server/models/IssueReport";
import User from "@/app/server/models/User";
import { Types } from "mongoose";
import { can, hasAllSchoolAccess } from "@/utils/roles";

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * GET /api/logs
 * Paged logins, activities and issue reports.
 * Query params:
 *   type     login | activity | issue | all (all = the latest few of each, for the overview)
 *   page     1-based page for a single type (default 1)
 *   limit    items per page (default 20, max 100)
 *   days     only the last N days (default 7)
 *   search   matches name, email, description, record name or issue title
 *   schoolId restricts to one school; ignored for users limited to their own school
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const userId = await verifiedUserId(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const user = await User.findById(userId).select("role schoolId").lean<{ role: string; schoolId?: unknown }>();
    if (!user || !(["admin", "school-leader", "learning-specialist"].includes(user.role) || can(user.role, "logs"))) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const params = req.nextUrl.searchParams;
    const type = params.get("type") || "all";
    const page = Math.max(1, parseInt(params.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "20") || 20));
    const days = Math.max(1, parseInt(params.get("days") || "7") || 7);
    const search = params.get("search")?.trim();

    // Users without all-school access only ever see their own school's logs
    const requestedSchool = params.get("schoolId");
    const schoolId = hasAllSchoolAccess(user.role)
      ? (requestedSchool && Types.ObjectId.isValid(requestedSchool) ? requestedSchool : null)
      : user.schoolId ? String(user.schoolId) : null;
    if (!hasAllSchoolAccess(user.role) && !schoolId) {
      return NextResponse.json({ success: false, error: "No school assigned" }, { status: 403 });
    }

    const since = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
    const base = schoolId ? { school: new Types.ObjectId(schoolId) } : {};
    const matching = (fields: string[]) => {
      if (!search) return {};
      const pattern = new RegExp(escapeRegex(search), "i");
      return { $or: fields.map((field) => ({ [field]: pattern })) };
    };
    const person = ["firstName", "lastName", "email"];

    const queries = {
      login: { ...base, loginTime: since, ...matching([...person, "userRole", "failureReason"]) },
      activity: { ...base, timestamp: since, ...matching([...person, "description", "entityName", "entityType"]) },
      issue: { ...base, reportedAt: since, ...matching([...person, "title", "description"]) },
    };

    // The overview shows only the latest few of each type
    const pageFor = (t: string) => (type === "all" ? { skip: 0, take: 5 } : type === t ? { skip: (page - 1) * limit, take: limit } : null);
    const empty = Promise.resolve([]);

    const loginPage = pageFor("login");
    const activityPage = pageFor("activity");
    const issuePage = pageFor("issue");

    const [loginLogs, activityLogs, issueLogs, loginTotal, activityTotal, issueTotal, openIssues] = await Promise.all([
      loginPage ? LoginLog.find(queries.login).sort({ loginTime: -1 }).skip(loginPage.skip).limit(loginPage.take).lean() : empty,
      activityPage
        ? ActivityLog.find(queries.activity).sort({ timestamp: -1 }).skip(activityPage.skip).limit(activityPage.take).lean()
        : empty,
      issuePage
        ? IssueReport.find(queries.issue)
            .sort({ reportedAt: -1 })
            .skip(issuePage.skip)
            .limit(issuePage.take)
            .populate("assignedTo", "firstName lastName email")
            .lean()
        : empty,
      // Totals always come back so the tabs and summary cards stay accurate
      LoginLog.countDocuments(queries.login),
      ActivityLog.countDocuments(queries.activity),
      IssueReport.countDocuments(queries.issue),
      IssueReport.countDocuments({ ...queries.issue, status: "open" }),
    ]);

    const total = { login: loginTotal, activity: activityTotal, issue: issueTotal }[type] ?? 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          loginLogs,
          activityLogs,
          issueLogs,
          loginTotal,
          activityTotal,
          issueTotal,
          openIssues,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Logs API Error]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/logs/activity
 * Create an activity log entry
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const userId = await verifiedUserId(req);
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
