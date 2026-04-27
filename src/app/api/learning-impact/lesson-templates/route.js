import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import LessonTemplate from "@/app/server/models/LessonTemplate";
import { checkSchoolAccess } from "@/app/server/utils/learningImpactAccess";

async function checkAccess(userId, schoolId) {
  return checkSchoolAccess(userId, schoolId);
}

// GET /api/learning-impact/lesson-templates?schoolId=...
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");

    if (!userId || !schoolId) {
      return NextResponse.json(
        { error: "User and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const templates = await LessonTemplate.find({ school: schoolId, isActive: true })
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("[LessonTemplates GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/learning-impact/lesson-templates
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { schoolId, name, description, frequency, criteria } = body;

    if (!userId || !schoolId) {
      return NextResponse.json(
        { error: "User and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const template = await LessonTemplate.create({
      name,
      description,
      school: schoolId,
      frequency: frequency || "daily",
      criteria: criteria || [],
      createdBy: userId,
    });

    return NextResponse.json(
      { message: "Lesson template created successfully", template },
      { status: 201 }
    );
  } catch (error) {
    console.error("[LessonTemplates POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/learning-impact/lesson-templates
export async function PUT(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { templateId, schoolId, name, description, frequency, criteria, isActive } = body;

    if (!userId || !schoolId || !templateId) {
      return NextResponse.json(
        { error: "Template ID, user, and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const template = await LessonTemplate.findOneAndUpdate(
      { _id: templateId, school: schoolId },
      {
        name,
        description,
        frequency,
        criteria,
        isActive,
        updatedBy: userId,
      },
      { new: true }
    );

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lesson template updated successfully", template },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LessonTemplates PUT Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/learning-impact/lesson-templates
export async function DELETE(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId");
    const schoolId = searchParams.get("schoolId");

    if (!userId || !schoolId || !templateId) {
      return NextResponse.json(
        { error: "Template ID, user, and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const template = await LessonTemplate.findOneAndUpdate(
      { _id: templateId, school: schoolId },
      { isActive: false, updatedBy: userId },
      { new: true }
    );

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lesson template deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LessonTemplates DELETE Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
