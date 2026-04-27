import { NextResponse } from "next/server";
import { connectDB } from "@/utils/db";
import PupilEffort from "@/app/server/models/PupilEffort";
import { checkSchoolAccess } from "@/app/server/utils/learningImpactAccess";

async function checkAccess(userId, schoolId) {
  return checkSchoolAccess(userId, schoolId);
}

// GET /api/learning-impact/pupil-efforts?schoolId=...
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const classId = req.nextUrl.searchParams.get("classId");
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
    if (studentId) query.student = studentId;
    if (classId) query.class = classId;
    if (week) query.week = parseInt(week);
    if (year) query.year = parseInt(year);

    const efforts = await PupilEffort.find(query)
      .populate("student", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name")
      .populate("submittedBy", "firstName lastName")
      .sort({ date: -1 });

    return NextResponse.json({ efforts }, { status: 200 });
  } catch (error) {
    console.error("[PupilEfforts GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/learning-impact/pupil-efforts
export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      schoolId,
      studentId,
      classId,
      subjectId,
      week,
      year,
      date,
      efforts,
      overallEffort,
      overallComment,
      improvementAreas,
      strengths,
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

    const effort = await PupilEffort.create({
      student: studentId,
      class: classId,
      subject: subjectId || null,
      school: schoolId,
      week: week || 1,
      year: year || new Date().getFullYear(),
      date: date || new Date(),
      efforts: efforts || [],
      overallEffort,
      overallComment,
      improvementAreas: improvementAreas || [],
      strengths: strengths || [],
      submittedBy: userId,
    });

    const populatedEffort = await PupilEffort.findById(effort._id)
      .populate("student", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    return NextResponse.json(
      { message: "Pupil effort submitted successfully", effort: populatedEffort },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PupilEfforts POST Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/learning-impact/pupil-efforts
export async function PUT(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      effortId,
      schoolId,
      efforts,
      overallEffort,
      overallComment,
      improvementAreas,
      strengths,
    } = body;

    if (!userId || !schoolId || !effortId) {
      return NextResponse.json(
        { error: "Effort ID, user, and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const effort = await PupilEffort.findOneAndUpdate(
      { _id: effortId, school: schoolId },
      { efforts, overallEffort, overallComment, improvementAreas, strengths },
      { new: true }
    )
      .populate("student", "firstName lastName")
      .populate("class", "name")
      .populate("subject", "name");

    if (!effort) {
      return NextResponse.json({ error: "Effort record not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Pupil effort updated successfully", effort },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PupilEfforts PUT Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/learning-impact/pupil-efforts
export async function DELETE(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { searchParams } = new URL(req.url);
    const effortId = searchParams.get("effortId");
    const schoolId = searchParams.get("schoolId");

    if (!userId || !schoolId || !effortId) {
      return NextResponse.json(
        { error: "Effort ID, user, and school information required" },
        { status: 401 }
      );
    }

    const hasAccess = await checkAccess(userId, schoolId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const effort = await PupilEffort.findOneAndDelete({
      _id: effortId,
      school: schoolId,
    });

    if (!effort) {
      return NextResponse.json({ error: "Effort record not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Pupil effort deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PupilEfforts DELETE Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
