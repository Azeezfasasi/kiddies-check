import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import Assessment from "@/app/server/models/Assessment";
import { connectDB } from "@/utils/db";
import { Types } from "mongoose";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const { id } = await params;

    if (!userId || !schoolId) {
      return Response.json({ error: "User and school information required" }, { status: 401 });
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Connect to database FIRST, before any queries
    await connectDB();

    // Verify user access
    const user = await User.findById(userId);
    
    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const student = await Student.findOne({ _id: id, school: schoolId })
      .populate("class", "name section")
      .populate("school", "name");

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch real assessment data from database
    const assessments = await Assessment.find({
      student: id,
      school: schoolId,
    }).populate("subject", "name");

    // Group assessments by subject and calculate average scores
    const subjectMap = {};
    assessments.forEach((assessment) => {
      const subjectName = assessment.subject?.name || "Unknown Subject";
      if (!subjectMap[subjectName]) {
        subjectMap[subjectName] = {
          subject: subjectName,
          scores: [],
          maxScore: assessment.maxScore || 100,
        };
      }
      subjectMap[subjectName].scores.push(assessment.score);
    });

    // Calculate performance data with actual averages
    const performanceData = Object.values(subjectMap).map((item) => ({
      subject: item.subject,
      score: Math.round(
        item.scores.reduce((a, b) => a + b, 0) / item.scores.length
      ),
      maxScore: item.maxScore,
    }));

    // If no assessments, provide empty performance array
    if (performanceData.length === 0) {
      performanceData.length = 0; // Empty array
    }

    // Calculate stats from actual data
    let average = 0,
      highest = 0,
      lowest = 100;
    if (performanceData.length > 0) {
      const scores = performanceData.map((p) => p.score);
      average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      highest = Math.max(...scores);
      lowest = Math.min(...scores);
    }

    // Calculate grade distribution from all assessments
    const gradeCount = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    assessments.forEach((assessment) => {
      const percentage = (assessment.score / (assessment.maxScore || 100)) * 100;
      if (percentage >= 90) gradeCount.A++;
      else if (percentage >= 80) gradeCount.B++;
      else if (percentage >= 70) gradeCount.C++;
      else if (percentage >= 60) gradeCount.D++;
      else gradeCount.F++;
    });

    // Format grade distribution for chart
    const gradeDistribution = [
      {
        name: "A (90-100)",
        value: gradeCount.A,
        fill: "#10b981",
      },
      {
        name: "B (80-89)",
        value: gradeCount.B,
        fill: "#3b82f6",
      },
      {
        name: "C (70-79)",
        value: gradeCount.C,
        fill: "#f59e0b",
      },
      {
        name: "D (60-69)",
        value: gradeCount.D,
        fill: "#ef5350",
      },
      {
        name: "F (<60)",
        value: gradeCount.F,
        fill: "#d32f2f",
      },
    ].filter((grade) => grade.value > 0); // Only show grades that exist in data

    // Generate attendance data based on assessment dates (mock-like but date-based)
    const attendanceMap = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    assessments.forEach((assessment) => {
      const date = new Date(assessment.date);
      const monthYear = `${monthNames[date.getMonth()]}-${date.getFullYear()}`;
      if (!attendanceMap[monthYear]) {
        attendanceMap[monthYear] = { month: monthNames[date.getMonth()], actual: 0, total: 0 };
      }
      attendanceMap[monthYear].actual++;
      attendanceMap[monthYear].total++;
    });

    // Convert attendance map to array (show last 5 months or all available)
    const attendanceData = Object.values(attendanceMap)
      .slice(-5)
      .map((item) => ({
        month: item.month,
        present: item.actual,
        absent: Math.max(0, 20 - item.total), // Assume ~20 school days per month
      }));

    return Response.json(
      {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          enrollmentNo: student.enrollmentNo,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          class: student.class,
          school: student.school,
          phone: student.phone,
          picture: student.picture,
          schoolType: student.schoolType,
        },
        performance: performanceData,
        stats: {
          average,
          highest,
          lowest,
          totalSubjects: performanceData.length,
        },
        attendance: attendanceData,
        gradeDistribution,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Student Stats Error]", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
