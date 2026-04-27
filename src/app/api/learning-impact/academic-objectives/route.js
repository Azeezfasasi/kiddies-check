import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import AcademicObjectiveRating from "@/app/server/models/AcademicObjectiveRating";
import { checkSchoolAccess } from "@/app/server/utils/learningImpactAccess";

async function checkAccess(userId, schoolId) {
  return checkSchoolAccess(userId, schoolId);
}

// GET /api/learning-impact/academic-objectives?schoolId=...
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const subjectId = req.nextUrl.searchParams.get("subjectId");
    const term = req.nextUrl.searchParams.get("term");
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
    if (studentId) query.student = studentId;
    if (subjectId) query.subject = subjectId;
    if (term) query.term = term;
    if (year) query.year = parseInt(year);

    const ratings = await AcademicObjectiveRating.find(query)
      .populate("student", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("ratedBy", "firstName lastName")
      .sort({ date: -1 });

    return NextResponse.json({ ratings }, { status: 200 });
  } catch (error) {
    console.error("[AcademicObjectives GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/learning-impact/academic-objectives
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      schoolId,
      studentId,
      classId,
      subjectId,
      term,
      year,
      date,
      objectives,
      overallProgress,
      teacherComment,
      nextSteps,
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

    const rating = await AcademicObjectiveRating.create({
      student: studentId,
      class: classId,
      subject: subjectId,
      school: schoolId,
      term: term || "first",
      year: year || new Date().getFullYear(),
      date: date || new Date(),
      objectives: objectives || [],
      overallProgress,
      teacherComment,
      nextSteps,
      ratedBy: userId,
    });

    const populatedRating = await AcademicObjectiveRating.findById(rating._id)
      .populate("student", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    return NextResponse.json(
      { message: "Academic objective rating created successfully", rating: populatedRating },
      { status: 201 }
    );
  } catch (error) {
    console.error("[AcademicObjectives POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/learning-impact/academic-objectives
export async function PUT(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { ratingId, schoolId, objectives, overallProgress, teacherComment, nextSteps } = body;

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

    const rating = await AcademicObjectiveRating.findOneAndUpdate(
      { _id: ratingId, school: schoolId },
      { objectives, overallProgress, teacherComment, nextSteps },
      { new: true }
    )
      .populate("student", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Academic objective rating updated successfully", rating },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AcademicObjectives PUT Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/learning-impact/academic-objectives
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

    const rating = await AcademicObjectiveRating.findOneAndDelete({
      _id: ratingId,
      school: schoolId,
    });

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Academic objective rating deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[AcademicObjectives DELETE Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
