import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import TeacherRating from "@/app/server/models/TeacherRating";
import { checkSchoolAccess } from "@/app/server/utils/learningImpactAccess";

async function checkAccess(userId, schoolId) {
  return checkSchoolAccess(userId, schoolId);
}

// GET /api/learning-impact/teacher-ratings?schoolId=...
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const teacherId = req.nextUrl.searchParams.get("teacherId");
    const ratingType = req.nextUrl.searchParams.get("ratingType");
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
    if (ratingType) query.ratingType = ratingType;
    if (week) query.week = parseInt(week);
    if (year) query.year = parseInt(year);

    const ratings = await TeacherRating.find(query)
      .populate("teacher", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("ratedBy", "firstName lastName")
      .sort({ date: -1 });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error("[TeacherRatings GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/learning-impact/teacher-ratings
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      schoolId,
      teacherId,
      classId,
      subjectId,
      ratingType,
      week,
      year,
      date,
      dimensions,
      overallScore,
      overallComment,
      strengths,
      developmentAreas,
      actionPlan,
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

    const rating = await TeacherRating.create({
      teacher: teacherId,
      class: classId || null,
      subject: subjectId || null,
      school: schoolId,
      ratingType: ratingType || "formal",
      week: week || 1,
      year: year || new Date().getFullYear(),
      date: date || new Date(),
      dimensions: dimensions || [],
      overallScore,
      overallComment,
      strengths: strengths || [],
      developmentAreas: developmentAreas || [],
      actionPlan,
      ratedBy: userId,
    });

    const populatedRating = await TeacherRating.findById(rating._id)
      .populate("teacher", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    return NextResponse.json(
      { message: "Teacher rating created successfully", rating: populatedRating },
      { status: 201 }
    );
  } catch (error) {
    console.error("[TeacherRatings POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/learning-impact/teacher-ratings
export async function PUT(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      ratingId,
      schoolId,
      dimensions,
      overallScore,
      overallComment,
      strengths,
      developmentAreas,
      actionPlan,
    } = body;

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

    const rating = await TeacherRating.findOneAndUpdate(
      { _id: ratingId, school: schoolId },
      { dimensions, overallScore, overallComment, strengths, developmentAreas, actionPlan },
      { new: true }
    )
      .populate("teacher", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Teacher rating updated successfully", rating },
      { status: 200 }
    );
  } catch (error) {
    console.error("[TeacherRatings PUT Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/learning-impact/teacher-ratings
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

    const rating = await TeacherRating.findOneAndDelete({
      _id: ratingId,
      school: schoolId,
    });

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Teacher rating deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[TeacherRatings DELETE Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
