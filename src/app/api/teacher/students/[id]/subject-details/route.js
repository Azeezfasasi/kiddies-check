import Student from "@/app/server/models/Student";
import User from "@/app/server/models/User";
import Assessment from "@/app/server/models/Assessment";
import Subject from "@/app/server/models/Subject";
import { connectDB } from "@/utils/db";
import { Types } from "mongoose";

export async function GET(req, { params }) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const subjectName = req.nextUrl.searchParams.get("subject");
    const { id } = await params;

    if (!userId || !schoolId || !subjectName) {
      return Response.json(
        { error: "User, school, and subject information required" },
        { status: 401 }
      );
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(schoolId)) {
      return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Verify user access
    const user = await User.findById(userId);

    if (!user) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    // Find student
    const student = await Student.findOne({ _id: id, school: schoolId }).populate("class", "name section");

    if (!student) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }

    // Find subject by name and school
    const subject = await Subject.findOne({
      name: subjectName,
      school: schoolId,
    });

    if (!subject) {
      return Response.json({ error: "Subject not found" }, { status: 404 });
    }

    // Fetch all assessments for this student in this subject
    const assessments = await Assessment.find({
      student: id,
      subject: subject._id,
      school: schoolId,
    })
      .populate("subject", "name description")
      .sort({ date: -1 });

    if (!assessments || assessments.length === 0) {
      return Response.json(
        {
          grade: "N/A",
          topicsCovered: 0,
          description: subject.description || "No description available",
          topics: [],
          strengths: ["No assessment data yet"],
          areasForImprovement: ["Awaiting assessment results"],
          remarks: "No assessments completed yet",
        },
        { status: 200 }
      );
    }

    // Calculate statistics
    const scores = assessments.map((a) => a.score);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);

    // Determine grade
    let grade = "F";
    if (avgScore >= 75) grade = "A1";
    else if (avgScore >= 70) grade = "B2";
    else if (avgScore >= 65) grade = "B3";
    else if (avgScore >= 60) grade = "C4";
    else if (avgScore >= 55) grade = "C5";
    else if (avgScore >= 50) grade = "C6";
    else if (avgScore >= 45) grade = "D7";
    else if (avgScore >= 40) grade = "E8";

    // Analyze assessment types
    const assessmentTypes = {};
    assessments.forEach((a) => {
      const type = a.assessmentType || "assignment";
      if (!assessmentTypes[type]) {
        assessmentTypes[type] = [];
      }
      assessmentTypes[type].push(a.score);
    });

    // Identify strengths (assessment types with higher average)
    const strengths = [];
    const weaknesses = [];

    Object.entries(assessmentTypes).forEach(([type, scores]) => {
      const typeAvg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      if (typeAvg >= 80) {
        strengths.push(`Strong performance in ${type}s (${typeAvg}%)`);
      } else if (typeAvg < 70) {
        weaknesses.push(`Needs improvement in ${type}s (${typeAvg}%)`);
      }
    });

    // Add general strengths/weaknesses
    if (avgScore >= 85) {
      if (!strengths.includes("Excellent overall subject grasp"))
        strengths.push("Excellent overall subject grasp");
    }

    if (maxScore - minScore > 20) {
      if (!weaknesses.includes("Inconsistent performance across assessments"))
        weaknesses.push("Inconsistent performance across assessments");
    }

    if (strengths.length === 0) {
      strengths.push("Building foundational knowledge");
    }

    if (weaknesses.length === 0) {
      weaknesses.push("Continue regular practice and revision");
    }

    // Create mock topics based on assessment count
    const topics = [];
    const topicNames = [
      "Foundations & Basics",
      "Intermediate Concepts",
      "Advanced Topics",
      "Application & Practice",
      "Assessment & Review",
    ];

    for (let i = 0; i < Math.min(assessments.length, 5); i++) {
      topics.push({
        name: topicNames[i] || `Topic ${i + 1}`,
        progress: Math.round(((i + 1) / Math.min(assessments.length, 5)) * 100),
      });
    }

    // Generate teacher remarks
    const remarks =
      avgScore >= 85
        ? `Excellent performance in ${subjectName}. Student demonstrates strong understanding and consistency.`
        : avgScore >= 70
        ? `Good progress in ${subjectName}. Student shows understanding but may benefit from additional practice.`
        : `Student is developing in ${subjectName}. Encourage consistent effort and practice to improve mastery.`;

    return Response.json(
      {
        subjectName,
        score: avgScore,
        grade,
        topicsCovered: assessments.length,
        description: subject.description || `${subjectName} is a comprehensive subject designed to develop student skills and knowledge.`,
        topics,
        strengths,
        areasForImprovement: weaknesses,
        remarks,
        statistics: {
          average: avgScore,
          highest: maxScore,
          lowest: minScore,
          assessmentCount: assessments.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching subject details:", error);
    return Response.json(
      { error: "Failed to fetch subject details" },
      { status: 500 }
    );
  }
}
