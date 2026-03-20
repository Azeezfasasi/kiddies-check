import Assessment from "@/app/server/models/Assessment";
import AssessmentTrend from "@/app/server/models/AssessmentTrend";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

async function recalculateTrend(studentId, subjectId, schoolId, year) {
  // Fetch all assessments for this student-subject combination
  const assessments = await Assessment.find({ student: studentId, subject: subjectId, school: schoolId })
    .sort({ date: 1 });

  if (assessments.length === 0) {
    // Delete trend if no assessments
    await AssessmentTrend.deleteOne({ student: studentId, subject: subjectId, school: schoolId, year });
    return null;
  }

  const scores = assessments.map((a) => a.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  // Calculate trend
  let trend = "stable";
  let trendPercentage = 0;

  if (assessments.length >= 3) {
    const firstThreeAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const lastThreeAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const change = lastThreeAvg - firstThreeAvg;

    trendPercentage = ((change / firstThreeAvg) * 100).toFixed(2);

    if (change > 5) trend = "improving";
    else if (change < -5) trend = "declining";
    else trend = "stable";
  }

  const weeklyScores = assessments.map((a) => ({
    week: a.week,
    score: a.score,
    date: a.date,
    assessmentType: a.assessmentType,
  }));

  return {
    averageScore: parseFloat(averageScore.toFixed(2)),
    highestScore,
    lowestScore,
    totalAssessments: assessments.length,
    trend,
    trendPercentage: parseFloat(trendPercentage),
    weeklyScores,
  };
}

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const assessment = await Assessment.findOne({ _id: id, school: schoolId })
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("class", "name")
      .populate("teacher", "firstName lastName");

    if (!assessment) {
      return Response.json({ error: "Assessment not found" }, { status: 404 });
    }

    return Response.json({ assessment }, { status: 200 });
  } catch (error) {
    console.error("[Assessment Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;
    const { score, gradeLevel, remarks, assessmentType } = await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // Check assessment exists
    const assessment = await Assessment.findOne({ _id: id, school: schoolId });
    if (!assessment) {
      return Response.json({ error: "Assessment not found" }, { status: 404 });
    }

    const updatedAssessment = await Assessment.findByIdAndUpdate(
      id,
      {
        score: score !== undefined ? score : assessment.score,
        gradeLevel: gradeLevel || assessment.gradeLevel,
        remarks: remarks || assessment.remarks,
        assessmentType: assessmentType || assessment.assessmentType,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("class", "name")
      .populate("teacher", "firstName lastName");

    // Recalculate trend
    const trendData = await recalculateTrend(
      assessment.student,
      assessment.subject,
      schoolId,
      assessment.year
    );

    if (trendData) {
      await AssessmentTrend.findOneAndUpdate(
        { student: assessment.student, subject: assessment.subject, school: schoolId, year: assessment.year },
        {
          ...trendData,
          lastUpdate: new Date(),
        },
        { upsert: true }
      );
    }

    return Response.json(
      { message: "Assessment updated successfully", assessment: updatedAssessment },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Assessment Update Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user access
    const user = await User.findById(userId);
    if (!user || !user.schoolId.equals(schoolId) && !user.managedSchools?.includes(schoolId)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    const assessment = await Assessment.findOne({ _id: id, school: schoolId });
    if (!assessment) {
      return Response.json({ error: "Assessment not found" }, { status: 404 });
    }

    await Assessment.findByIdAndDelete(id);

    // Recalculate trend after deletion
    const trendData = await recalculateTrend(
      assessment.student,
      assessment.subject,
      schoolId,
      assessment.year
    );

    if (trendData) {
      await AssessmentTrend.findOneAndUpdate(
        { student: assessment.student, subject: assessment.subject, school: schoolId, year: assessment.year },
        {
          ...trendData,
          lastUpdate: new Date(),
        },
        { upsert: true }
      );
    }

    return Response.json({ message: "Assessment deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Assessment Delete Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
