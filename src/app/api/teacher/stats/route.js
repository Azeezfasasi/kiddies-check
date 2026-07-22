import { authenticate } from "@/app/server/middleware/auth.js";
import { connectDB } from "@/utils/db.js";
import { NextResponse } from "next/server";
import { Types } from "mongoose";
import Class from "@/app/server/models/Class.js";
import Subject from "@/app/server/models/Subject.js";
import Assessment from "@/app/server/models/Assessment.js";
import Student from "@/app/server/models/Student.js";
import SchoolMember from "@/app/server/models/SchoolMember.js";

// GET /api/teacher/stats
// Fetch teacher statistics for their teaching activities
export async function GET(req) {
  return authenticate(req, async (user) => {
    try {
      const { searchParams } = new URL(req.url);
      const schoolId = searchParams.get("schoolId");

      if (!schoolId) {
        return NextResponse.json(
          { error: "School ID is required" },
          { status: 400 }
        );
      }

      await connectDB();

      // Convert schoolId string to ObjectId for consistent database queries
      const schoolObjectId = new Types.ObjectId(schoolId);

      // Verify teacher access: check if user is a teacher in this school
      const isTeacherInSchool = await SchoolMember.findOne({
        user: user._id,
        school: schoolObjectId,
        role: "teacher",
        status: "active",
      });

      // Also allow if user is an admin/learning-specialist/teacher with school management access
      const hasManagementAccess =
        user &&
        ((user.role === "admin" || user.role === "learning-specialist") ||
          (user.schoolId && user.schoolId.toString() === schoolId) ||
          (user.managedSchools &&
            user.managedSchools.some((id) => id.toString() === schoolId)));

      const hasAccess = isTeacherInSchool || hasManagementAccess;

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Get all classes taught by this teacher (field name is `classTeacher` in the model)
      const classes = await Class.find({
        classTeacher: user._id,
        school: schoolObjectId,
      }).lean();

      // Debug logging to help diagnose empty results in development
      if (process.env.NODE_ENV !== "production") {
        try {
          const classIds = classes.map((c) => c._id);
          console.debug("TeacherStats debug:", {
            userId: user._id?.toString(),
            role: user.role,
            classesFound: classes.length,
            classIds: classIds,
          });
        } catch (e) {
          console.debug("TeacherStats debug failed to stringify classes", e.message);
        }
      }

      // Fallbacks: if no classes found via `classTeacher`, try legacy `teacher` field
      // and then try subjects taught by the teacher (subjects -> classes mapping).
      let effectiveClasses = classes;
      let fallbackUsed = null;

      if (classes.length === 0) {
        // Try legacy `teacher` field
        const legacyClasses = await Class.find({
          $or: [{ teacher: user._id }, { teacher: user._id?.toString() }],
          school: schoolObjectId,
        }).lean();

        if (legacyClasses.length > 0) {
          effectiveClasses = legacyClasses;
          fallbackUsed = "legacy_teacher_field";
        }
      }

      if (effectiveClasses.length === 0) {
        // Try subjects taught by this teacher, then collect classes referenced by those subjects
        const subjects = await Subject.find({ school: schoolObjectId, teacher: user._id }).lean();
        const classIdsFromSubjects = subjects.flatMap((s) => s.classes || []);
        if (classIdsFromSubjects.length > 0) {
          const classesFromSubjects = await Class.find({ _id: { $in: classIdsFromSubjects }, school: schoolObjectId }).lean();
          if (classesFromSubjects.length > 0) {
            effectiveClasses = classesFromSubjects;
            fallbackUsed = "subjects_to_classes";
          }
        }
      }

      if (process.env.NODE_ENV !== "production") {
        console.debug("TeacherStats fallback:", { fallbackUsed, effectiveCount: effectiveClasses.length });
      }

      // If we still have no classes for this teacher, dump a small sample of classes
      // in the school so we can inspect their `classTeacher` values in the server log.
      if (effectiveClasses.length === 0 && process.env.NODE_ENV !== "production") {
        try {
          const sampleClasses = await Class.find({ school: schoolObjectId })
            .limit(10)
            .select("name classTeacher")
            .lean();
          console.debug(
            "TeacherStats sample classes:",
            sampleClasses.map((c) => ({ id: c._id?.toString(), name: c.name, classTeacher: c.classTeacher }))
          );
        } catch (e) {
          console.debug("TeacherStats sample classes failed:", e.message);
        }
      }

      // Replace classes and classIds for the rest of the computation
      const classIds = effectiveClasses.map((c) => c._id);

      // Fetch stats in parallel
      const [studentsInClasses, subjectsTeaching, assessmentsCreated] =
        await Promise.all([
          Student.countDocuments({ class: { $in: classIds } }),
          Subject.countDocuments({ school: schoolObjectId, teacher: user._id }),
          Assessment.countDocuments({ teacher: user._id, school: schoolObjectId }),
        ]);

      // Calculate assessment rate (ratio of students assessed)
      const totalStudents = studentsInClasses || 1; // Avoid division by zero
      const assessmentRate =
        totalStudents > 0 ? ((assessmentsCreated / totalStudents) * 100).toFixed(2) : 0;

      const stats = {
        totalStudents: studentsInClasses,
        classesTeaching: effectiveClasses.length,
        subjectsTeaching: subjectsTeaching,
        assessmentsCreated: assessmentsCreated,
        assessmentRate: parseFloat(assessmentRate),
      };

      return NextResponse.json(
        {
          success: true,
          stats,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Teacher stats error:", error);
      return NextResponse.json(
        { error: "Failed to fetch teacher statistics", details: error.message },
        { status: 500 }
      );
    }
  });
}
