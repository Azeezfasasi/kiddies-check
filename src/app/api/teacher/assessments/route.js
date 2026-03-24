import Assessment from "@/app/server/models/Assessment";
import AssessmentTrend from "@/app/server/models/AssessmentTrend";
import User from "@/app/server/models/User";
import { connectDB } from "@/utils/db";

function getGradeLevel(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

async function calculateTrend(studentId, subjectId, schoolId) {
  // Fetch all assessments for this student-subject combination
  const assessments = await Assessment.find({ student: studentId, subject: subjectId, school: schoolId })
    .sort({ date: 1 });

  if (assessments.length === 0) return null;

  const scores = assessments.map((a) => a.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  // Calculate trend (last 3 vs first 3 assessments)
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

  return {
    averageScore: parseFloat(averageScore.toFixed(2)),
    highestScore,
    lowestScore,
    totalAssessments: assessments.length,
    trend,
    trendPercentage: parseFloat(trendPercentage),
  };
}

export async function POST(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const { schoolId, studentId, subjectId, classId, week, year, date, score, maxScore, gradeLevel, remarks, assessmentType } =
      await req.json();

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    const hasSchoolAccess = 
      (user?.schoolId && user.schoolId.toString() === schoolId) || 
      (user?.managedSchools && user.managedSchools.some(id => id.toString() === schoolId));
    if (!user || !hasSchoolAccess) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    await connectDB();

    // Check if assessment already exists for this week
    const existing = await Assessment.findOne({
      student: studentId,
      subject: subjectId,
      school: schoolId,
      week,
      year,
    });

    if (existing) {
      return Response.json({ error: "Assessment for this week already exists" }, { status: 400 });
    }

    // Auto-calculate grade level if not provided
    const finalGradeLevel = gradeLevel || getGradeLevel(score);

    const newAssessment = await Assessment.create({
      student: studentId,
      subject: subjectId,
      class: classId,
      school: schoolId,
      week,
      year,
      date: date || new Date(),
      score,
      maxScore: maxScore || 100,
      gradeLevel: finalGradeLevel,
      remarks,
      assessmentType: assessmentType || "assignment",
      teacher: userId,
    });

    // Calculate trend and update AssessmentTrend
    const trendData = await calculateTrend(studentId, subjectId, schoolId);

    if (trendData) {
      const weeklyScores = await Assessment.find({ student: studentId, subject: subjectId, school: schoolId })
        .sort({ date: 1 })
        .lean();

      await AssessmentTrend.findOneAndUpdate(
        { student: studentId, subject: subjectId, school: schoolId, year },
        {
          student: studentId,
          subject: subjectId,
          class: classId,
          school: schoolId,
          year,
          weeklyScores: weeklyScores.map((a) => ({
            week: a.week,
            score: a.score,
            date: a.date,
            assessmentType: a.assessmentType,
          })),
          ...trendData,
          lastUpdate: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    // Populate references after creation
    const populatedAssessment = await Assessment.findById(newAssessment._id)
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("class", "name");

    return Response.json(
      { message: "Assessment recorded successfully", assessment: populatedAssessment },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Assessments Create Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const studentId = req.nextUrl.searchParams.get("studentId");
    const subjectId = req.nextUrl.searchParams.get("subjectId");
    const classId = req.nextUrl.searchParams.get("classId");

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Verify user has access to this school
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }
    
    // Allow admin and learning-specialist full access to any school
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      const hasAccess = 
        (user.schoolId && user.schoolId.toString() === schoolId) || 
        (user.managedSchools && user.managedSchools.some(id => id.toString() === schoolId));
      
      if (!hasAccess) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    await connectDB();

    const query = { school: schoolId };
    if (studentId) query.student = studentId;
    if (subjectId) query.subject = subjectId;
    if (classId) query.class = classId;

    const assessments = await Assessment.find(query)
      .populate("student", "firstName lastName")
      .populate("subject", "name")
      .populate("class", "name")
      .sort({ date: -1 });

    return Response.json({ assessments }, { status: 200 });
  } catch (error) {
    console.error("[Assessments Get Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
