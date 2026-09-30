import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
/**
 * /api/admin/promotions
 * Grade promotion management (admin only)
 */

import { connectDB } from "@/app/server/db/connect";
import PromotionRecord from "@/app/server/models/PromotionRecord";
import Student from "@/app/server/models/Student";
import Class from "@/app/server/models/Class";
import School from "@/app/server/models/School";
import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { can, type AccessLevel } from "@/utils/roles";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// School-leaders and learning-specialists may manage promotions, but only
// admins get cross-school access — everyone else must be scoped below.
// level "view" for loading students, "edit" for running a promotion.
const verifyAccess = async (req, level: AccessLevel = "view") => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Unauthorized: Invalid token", status: 401 };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user || !(["admin", "learning-specialist", "school-leader"].includes(user.role) || can(user.role, "promotion", level))) {
      return { error: "Forbidden: Insufficient permissions", status: 403 };
    }

    return { user };
  } catch (error) {
    return { error: "Unauthorized: Invalid token", status: 401 };
  }
};

// Admins can act on any school. Everyone else must be an active member of
// that specific school (or have it as their primary/managed school) —
// having the learning-specialist/school-leader role alone is not enough.
const verifySchoolScope = async (user, schoolId) => {
  if (user.role === "admin" || can(user.role, "promotion")) return true;
  if (user.schoolId && user.schoolId.toString() === schoolId) return true;
  if (user.managedSchools?.some((id) => id.toString() === schoolId)) return true;

  const membership = await SchoolMember.findOne({
    user: user._id,
    school: schoolId,
    role: { $in: ["school-leader", "learning-specialist"] },
    status: "active",
  });
  return !!membership;
};

/**
 * GET /api/admin/promotions
 * Get eligible students for promotion by school
 * Query: ?schoolId=&academicSession=
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAccess(request);
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const academicSession = searchParams.get("academicSession");

    if (!schoolId) {
      return Response.json(
        { success: false, message: "schoolId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (!(await verifySchoolScope(auth.user, schoolId))) {
      return Response.json(
        { success: false, message: "Forbidden: You do not have access to this school" },
        { status: 403 }
      );
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return Response.json(
        { success: false, message: "School not found" },
        { status: 404 }
      );
    }

    // Get all active classes for this school
    const classes = await Class.find({ school: schoolId, isActive: true })
      .populate("classTeacher", "firstName lastName")
      .sort({ name: 1 });

    // Get all active students grouped by class
    const students = await Student.find({ school: schoolId, isActive: true })
      .populate("class", "name level section")
      .populate("parent", "firstName lastName email")
      .sort({ firstName: 1 });

    // Group students by class
    const classGroups = classes.map((cls) => ({
      class: cls,
      students: students.filter(
        (s) => s.class && s.class._id.toString() === cls._id.toString()
      ),
    }));

    // If academicSession provided, check which students were already promoted
    let alreadyPromotedStudentIds = new Set();
    if (academicSession) {
      const existingRecords = await PromotionRecord.find({
        school: schoolId,
        academicSession,
        status: { $in: ["promoted", "graduated"] },
      }).select("student");
      alreadyPromotedStudentIds = new Set(
        existingRecords.map((r) => r.student.toString())
      );
    }

    return Response.json(
      {
        success: true,
        school: { id: school._id, name: school.name },
        academicSession: academicSession || null,
        classGroups: classGroups.map((g) => ({
          class: g.class,
          students: g.students.map((s) => ({
            ...s.toObject(),
            alreadyPromoted: alreadyPromotedStudentIds.has(s._id.toString()),
          })),
          studentCount: g.students.length,
        })),
        totalStudents: students.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching promotion data:", error);
    return Response.json(
      { success: false, message: "Failed to fetch promotion data", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotions
 * Run bulk grade promotion
 * Body: { schoolId, academicSession, mappings: [{ fromClassId, toClassId, retainedStudentIds: [] }], remarks }
 */
async function postHandler(request: NextRequest) {
  try {
    const auth = await verifyAccess(request, "edit");
    if (auth.error) {
      return Response.json(
        { success: false, message: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { schoolId, academicSession, mappings, remarks } = body;

    if (!schoolId || !academicSession || !Array.isArray(mappings) || mappings.length === 0) {
      return Response.json(
        { success: false, message: "schoolId, academicSession, and mappings are required" },
        { status: 400 }
      );
    }

    await connectDB();

    if (!(await verifySchoolScope(auth.user, schoolId))) {
      return Response.json(
        { success: false, message: "Forbidden: You do not have access to this school" },
        { status: 403 }
      );
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return Response.json(
        { success: false, message: "School not found" },
        { status: 404 }
      );
    }

    const results = [];
    const errors = [];

    const validMappings = mappings.filter((mapping) => {
      if (!mapping.fromClassId) errors.push({ fromClassId: mapping.fromClassId, error: "fromClassId is required" });
      return Boolean(mapping.fromClassId);
    });
    const fromClassIds = [...new Set(validMappings.map((m) => String(m.fromClassId)))];

    // Snapshot every source class before moving anyone, so a pupil promoted
    // P1 -> P2 is not picked up again by a P2 -> P3 mapping in the same run.
    const students = await Student.find({ school: schoolId, class: { $in: fromClassIds }, isActive: true })
      .select("_id class")
      .lean();
    const alreadyDone = await PromotionRecord.find({
      student: { $in: students.map((s) => s._id) },
      academicSession,
      status: { $in: ["promoted", "graduated"] },
    }).distinct("student");

    const handled = new Set(alreadyDone.map(String)); // skip pupils already promoted/graduated this session
    const studentsByClass = new Map();
    for (const s of students) {
      const key = String(s.class);
      if (!studentsByClass.has(key)) studentsByClass.set(key, []);
      studentsByClass.get(key).push(s);
    }

    const records = [];
    const studentUpdates = [];
    const now = new Date();

    for (const { fromClassId, toClassId, retainedStudentIds = [] } of validMappings) {
      // If no toClassId, treat as graduation for all non-retained students
      const isGraduation = !toClassId;
      const retainedSet = new Set(retainedStudentIds.map(String));

      for (const student of studentsByClass.get(String(fromClassId)) || []) {
        const studentIdStr = String(student._id);
        if (handled.has(studentIdStr)) continue;
        handled.add(studentIdStr);

        const base = { student: student._id, academicSession, promotionDate: now, promotedBy: auth.user._id, school: schoolId };

        if (retainedSet.has(studentIdStr)) {
          records.push({ ...base, fromClass: fromClassId, toClass: fromClassId, status: "retained", remarks: remarks || "Retained" });
          results.push({ studentId: student._id, status: "retained" });
        } else if (isGraduation) {
          records.push({ ...base, fromClass: fromClassId, toClass: fromClassId, status: "graduated", remarks: remarks || "Graduated" });
          // Graduated pupils are deactivated
          studentUpdates.push({ updateOne: { filter: { _id: student._id }, update: { $set: { isActive: false } } } });
          results.push({ studentId: student._id, status: "graduated" });
        } else {
          records.push({ ...base, fromClass: student.class, toClass: toClassId, status: "promoted", remarks: remarks || "Promoted to next class" });
          studentUpdates.push({ updateOne: { filter: { _id: student._id }, update: { $set: { class: toClassId } } } });
          results.push({ studentId: student._id, status: "promoted" });
        }
      }
    }

    // Records first: they mark pupils as done, so if moving them then fails a
    // re-run can't promote anyone twice.
    if (records.length) await PromotionRecord.insertMany(records);
    if (studentUpdates.length) await Student.bulkWrite(studentUpdates, { ordered: false });

    // Update class student counts
    const allClassIds = [
      ...new Set(validMappings.flatMap((m) => [m.fromClassId, m.toClassId].filter(Boolean).map(String))),
    ].filter((id) => mongoose.isValidObjectId(id));
    const counts = await Student.aggregate([
      { $match: { class: { $in: allClassIds.map((id) => new mongoose.Types.ObjectId(id)) }, isActive: true } },
      { $group: { _id: "$class", n: { $sum: 1 } } },
    ]);
    const countByClass = new Map(counts.map((c) => [String(c._id), c.n]));
    if (allClassIds.length) {
      await Class.bulkWrite(
        allClassIds.map((classId) => ({
          updateOne: { filter: { _id: new mongoose.Types.ObjectId(classId) }, update: { $set: { numberOfStudents: countByClass.get(classId) ?? 0 } } },
        }))
      );
    }

    return Response.json(
      {
        success: true,
        message: `Promotion completed. ${results.length} students processed.`,
        processed: results.length,
        errors: errors.length > 0 ? errors : undefined,
        details: results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error running promotion:", error);
    return Response.json(
      { success: false, message: "Failed to run promotion", error: error.message },
      { status: 500 }
    );
  }
}


export const POST = withAudit(postHandler);
