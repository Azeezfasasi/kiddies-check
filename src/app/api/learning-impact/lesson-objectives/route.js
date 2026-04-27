import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import LessonObjectiveRating from "@/app/server/models/LessonObjectiveRating";
import { checkSchoolAccess } from "@/app/server/utils/learningImpactAccess";

async function checkAccess(userId, schoolId) {
  return checkSchoolAccess(userId, schoolId);
}

// GET /api/learning-impact/lesson-objectives?schoolId=...
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const teacherId = req.nextUrl.searchParams.get("teacherId");
    const classId = req.nextUrl.searchParams.get("classId");
    const subjectId = req.nextUrl.searchParams.get("subjectId");
    const week = req.nextUrl.searchParams.get("week");
    const year = req.nextUrl.searchParams.get("year");

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

    const query = { school: schoolId };
    if (teacherId) query.teacher = teacherId;
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;
    if (week) query.week = parseInt(week);
    if (year) query.year = parseInt(year);

    const ratings = await LessonObjectiveRating.find(query)
      .populate("teacher", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("ratedBy", "firstName lastName")
      .sort({ date: -1 });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error("[LessonObjectives GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/learning-impact/lesson-objectives
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      schoolId,
      teacherId,
      classId,
      subjectId,
      week,
      year,
      date,
      objectives,
      overallRating,
      teachersComment,
      improvementSuggestions,
    } = body;

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

    const rating = await LessonObjectiveRating.create({
      teacher: teacherId,
      class: classId,
      subject: subjectId,
      school: schoolId,
      week: week || 1,
      year: year || new Date().getFullYear(),
      date: date || new Date(),
      objectives: objectives || [],
      overallRating,
      teachersComment,
      improvementSuggestions,
      ratedBy: userId,
    });

    const populatedRating = await LessonObjectiveRating.findById(rating._id)
      .populate("teacher", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    return NextResponse.json(
      { message: "Lesson objective rating created successfully", rating: populatedRating },
      { status: 201 }
    );
  } catch (error) {
    console.error("[LessonObjectives POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/learning-impact/lesson-objectives
export async function PUT(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { ratingId, schoolId, objectives, overallRating, teachersComment, improvementSuggestions } = body;

    if (!userId || !schoolId || !ratingId) {
      return NextResponse.json(
        { error: "Rating ID, user, and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const rating = await LessonObjectiveRating.findOneAndUpdate(
      { _id: ratingId, school: schoolId },
      { objectives, overallRating, teachersComment, improvementSuggestions },
      { new: true }
    )
      .populate("teacher", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lesson objective rating updated successfully", rating },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LessonObjectives PUT Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/learning-impact/lesson-objectives
export async function DELETE(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { searchParams } = new URL(req.url);
    const ratingId = searchParams.get("ratingId");
    const schoolId = searchParams.get("schoolId");

    if (!userId || !schoolId || !ratingId) {
      return NextResponse.json(
        { error: "Rating ID, user, and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const rating = await LessonObjectiveRating.findOneAndDelete({
      _id: ratingId,
      school: schoolId,
    });

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Lesson objective rating deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[LessonObjectives DELETE Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

