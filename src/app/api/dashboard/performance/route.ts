import { type NextRequest, NextResponse } from "next/server";
import { authenticate, isAdmin } from "@/app/server/middleware/auth";
import Assessment from "@/app/server/models/Assessment";
import { connectDB } from "@/app/server/db/connect";

const categories = [
  { name: "Excellent (75-100)", min: 75, max: 100, fill: "#10b981" },
  { name: "Good (65-74)", min: 65, max: 75, fill: "#3b82f6" },
  { name: "Average (50-64)", min: 50, max: 65, fill: "#f59e0b" },
  { name: "Below Average (40-49)", min: 40, max: 50, fill: "#ef5350" },
  { name: "Poor (<40)", min: 0, max: 40, fill: "#d32f2f" },
];

function buildDistribution(assessments) {
  const scoresByStudent = new Map();

  assessments.forEach((assessment) => {
    const percentage = assessment.maxScore > 0
      ? (assessment.score / assessment.maxScore) * 100
      : 0;
    const key = assessment.student.toString();
    const scores = scoresByStudent.get(key) || [];
    scores.push(percentage);
    scoresByStudent.set(key, scores);
  });

  return categories.map((category) => ({
    name: category.name,
    value: Array.from(scoresByStudent.values()).filter((scores) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      return average >= category.min && average < category.max;
    }).length,
    fill: category.fill,
  }));
}

export async function GET(req: NextRequest) {
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      try {
        const schoolId = req.nextUrl.searchParams.get("schoolId");
        if (!schoolId) {
          return NextResponse.json({ success: false, message: "School ID is required" }, { status: 400 });
        }

        await connectDB();
        const currentYear = new Date().getFullYear();
        const [current, previous] = await Promise.all([
          Assessment.find({ school: schoolId, year: currentYear }).select("student score maxScore"),
          Assessment.find({ school: schoolId, year: currentYear - 1 }).select("student score maxScore"),
        ]);

        return NextResponse.json({
          success: true,
          currentPerformance: buildDistribution(current),
          previousPerformanceData: buildDistribution(previous),
        });
      } catch (error) {
        console.error("Dashboard performance error:", error);
        return NextResponse.json({ success: false, message: "Failed to fetch performance data" }, { status: 500 });
      }
    });
  });
}