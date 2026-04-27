import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/utils/db";
import LessonObjectiveRating from "@/app/server/models/LessonObjectiveRating";
import AcademicObjectiveRating from "@/app/server/models/AcademicObjectiveRating";
import PupilEffort from "@/app/server/models/PupilEffort";
import TeacherRating from "@/app/server/models/TeacherRating";
import { checkSchoolAccess } from "@/app/server/utils/learningImpactAccess";

async function checkAccess(userId, schoolId) {
  return checkSchoolAccess(userId, schoolId);
}

// GET /api/learning-impact/summary?schoolId=...
export async function GET(req) {
  try {
    const userId = req.headers.get("x-user-id");
    const schoolId = req.nextUrl.searchParams.get("schoolId");
    const year = req.nextUrl.searchParams.get("year") || new Date().getFullYear();

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

    const [
      lessonObjectiveStats,
      academicObjectiveStats,
      pupilEffortStats,
      teacherRatingStats,
    ] = await Promise.all([
      // Lesson Objective Ratings summary
      LessonObjectiveRating.aggregate([
        { $match: { school: new mongoose.Types.ObjectId(schoolId), year: parseInt(year) } },
        {
          $group: {
            _id: null,
            avgOverallRating: { $avg: "$overallRating" },
            totalRatings: { $sum: 1 },
            teachersRated: { $addToSet: "$teacher" },
          },
        },
      ]),

      // Academic Objective Ratings summary
      AcademicObjectiveRating.aggregate([
        { $match: { school: new mongoose.Types.ObjectId(schoolId), year: parseInt(year) } },
        {
          $group: {
            _id: null,
            avgOverallProgress: { $avg: "$overallProgress" },
            totalRatings: { $sum: 1 },
            studentsRated: { $addToSet: "$student" },
          },
        },
      ]),

      // Pupil Efforts summary
      PupilEffort.aggregate([
        { $match: { school: new mongoose.Types.ObjectId(schoolId), year: parseInt(year) } },
        {
          $group: {
            _id: null,
            avgOverallEffort: { $avg: "$overallEffort" },
            totalSubmissions: { $sum: 1 },
            studentsTracked: { $addToSet: "$student" },
          },
        },
      ]),

      // Teacher Ratings summary
      TeacherRating.aggregate([
        { $match: { school: new mongoose.Types.ObjectId(schoolId), year: parseInt(year) } },
        {
          $group: {
            _id: null,
            avgOverallScore: { $avg: "$overallScore" },
            totalRatings: { $sum: 1 },
            teachersRated: { $addToSet: "$teacher" },
          },
        },
      ]),
    ]);

    // Get recent activity for each type
    const [
      recentLessonObjectives,
      recentAcademicObjectives,
      recentPupilEfforts,
      recentTeacherRatings,
    ] = await Promise.all([
      LessonObjectiveRating.find({ school: schoolId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("teacher", "firstName lastName")
        .lean(),
      AcademicObjectiveRating.find({ school: schoolId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "firstName lastName")
        .lean(),
      PupilEffort.find({ school: schoolId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("student", "firstName lastName")
        .lean(),
      TeacherRating.find({ school: schoolId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("teacher", "firstName lastName")
        .lean(),
    ]);

    const summary = {
      lessonObjectives: {
        averageRating: lessonObjectiveStats[0]?.avgOverallRating || 0,
        totalRatings: lessonObjectiveStats[0]?.totalRatings || 0,
        teachersRated: lessonObjectiveStats[0]?.teachersRated?.length || 0,
        recent: recentLessonObjectives,
      },
      academicObjectives: {
        averageProgress: academicObjectiveStats[0]?.avgOverallProgress || 0,
        totalRatings: academicObjectiveStats[0]?.totalRatings || 0,
        studentsRated: academicObjectiveStats[0]?.studentsRated?.length || 0,
        recent: recentAcademicObjectives,
      },
      pupilEfforts: {
        averageEffort: pupilEffortStats[0]?.avgOverallEffort || 0,
        totalSubmissions: pupilEffortStats[0]?.totalSubmissions || 0,
        studentsTracked: pupilEffortStats[0]?.studentsTracked?.length || 0,
        recent: recentPupilEfforts,
      },
      teacherRatings: {
        averageScore: teacherRatingStats[0]?.avgOverallScore || 0,
        totalRatings: teacherRatingStats[0]?.totalRatings || 0,
        teachersRated: teacherRatingStats[0]?.teachersRated?.length || 0,
        recent: recentTeacherRatings,
      },
      year: parseInt(year),
    };

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error("[LearningImpact Summary GET Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
