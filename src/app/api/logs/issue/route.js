import { NextResponse } from "next/server";
import { connectDB } from "@/app/server/db/connect";
import IssueReport from "@/app/server/models/IssueReport";
import User from "@/app/server/models/User";

/**
 * POST /api/logs/issue
 * Create an issue report
 */
export async function POST(req) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      category,
      severity = "medium",
      attachments = [],
      environmentInfo = {},
    } = await req.json();

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const issue = await IssueReport.create({
      user: userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userRole: user.role,
      school: user.schoolId,
      schoolName: user.schoolName,
      title,
      description,
      category,
      severity,
      attachments,
      environmentInfo,
      status: "open",
    });

    return NextResponse.json(
      { success: true, data: issue, message: "Issue reported successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Issue Report POST Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/logs/issue
 * Get all issues for a user or school
 */
export async function GET(req) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const status = req.nextUrl.searchParams.get("status");
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const query = {};

    // Admin/school-leader can see school issues
    if (["admin", "school-leader"].includes(user.role)) {
      if (schoolId) {
        query.school = schoolId;
      }
    } else {
      // Other users see only their issues
      query.user = userId;
    }

    if (status) {
      query.status = status;
    }

    const issues = await IssueReport.find(query)
      .sort("-reportedAt")
      .limit(limit)
      .skip(offset)
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .lean();

    const total = await IssueReport.countDocuments(query);

    return NextResponse.json(
      { success: true, data: issues, total },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Issue Report GET Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/logs/issue/:id
 * Update issue status or add comment
 */
export async function PATCH(req) {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const issueId = url.pathname.split("/").pop();

    const { status, resolutionNotes, comment } = await req.json();

    const issue = await IssueReport.findById(issueId);
    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Check permissions
    const user = await User.findById(userId);
    if (
      issue.user.toString() !== userId &&
      !["admin", "school-leader"].includes(user.role)
    ) {
      return NextResponse.json(
        { error: "You don't have permission to update this issue" },
        { status: 403 }
      );
    }

    if (status) {
      issue.status = status;
      if (status === "resolved" || status === "closed") {
        issue.resolvedAt = new Date();
        issue.resolvedBy = userId;
      }
    }

    if (resolutionNotes) {
      issue.resolutionNotes = resolutionNotes;
    }

    if (comment) {
      const userObj = await User.findById(userId);
      issue.comments.push({
        userId,
        userName: `${userObj.firstName} ${userObj.lastName}`,
        comment,
      });
    }

    await issue.save();

    return NextResponse.json(
      { success: true, data: issue },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Issue Report PATCH Error]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
