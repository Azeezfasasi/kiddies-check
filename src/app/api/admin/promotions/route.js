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
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const verifyAdmin = async (req) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Unauthorized: Invalid token", status: 401 };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user || !["admin", "learning-specialist"].includes(user.role)) {
      return { error: "Forbidden: Admin access required", status: 403 };
    }

    return { user };
  } catch (error) {
    return { error: "Unauthorized: Invalid token", status: 401 };
  }
};

/**
 * GET /api/admin/promotions
 * Get eligible students for promotion by school
 * Query: ?schoolId=&academicSession=
 */
export async function GET(request) {
  try {
    const auth = await verifyAdmin(request);
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
export async function POST(request) {
  try {
    const auth = await verifyAdmin(request);
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

    for (const mapping of mappings) {
      const { fromClassId, toClassId, retainedStudentIds = [] } = mapping;

      if (!fromClassId) {
        errors.push({ fromClassId, error: "fromClassId is required" });
        continue;
      }

      // If no toClassId, treat as graduation for all non-retained students
      const isGraduation = !toClassId;

      // Get students in fromClass
      const studentsInClass = await Student.find({
        school: schoolId,
        class: fromClassId,
        isActive: true,
      });

      const retainedSet = new Set(retainedStudentIds);

      for (const student of studentsInClass) {
        const studentIdStr = student._id.toString();

        // Skip if already promoted in this session
        const existing = await PromotionRecord.findOne({
          student: student._id,
          academicSession,
          status: { $in: ["promoted", "graduated"] },
        });

        if (existing) {
          continue;
        }

        if (retainedSet.has(studentIdStr)) {
          // Create retention record
          await PromotionRecord.create({
            student: student._id,
            fromClass: fromClassId,
            toClass: fromClassId,
            academicSession,
            promotionDate: new Date(),
            promotedBy: auth.user._id,
            status: "retained",
            remarks: remarks || "Retained",
            school: schoolId,
          });
          results.push({ studentId: student._id, status: "retained" });
          continue;
        }

        if (isGraduation) {
          // Graduate student
          await PromotionRecord.create({
            student: student._id,
            fromClass: fromClassId,
            toClass: fromClassId,
            academicSession,
            promotionDate: new Date(),
            promotedBy: auth.user._id,
            status: "graduated",
            remarks: remarks || "Graduated",
            school: schoolId,
          });
          // Optionally deactivate graduated student
          student.isActive = false;
          await student.save();
          results.push({ studentId: student._id, status: "graduated" });
        } else {
          // Promote student
          const oldClass = student.class;
          student.class = toClassId;
          await student.save();

          await PromotionRecord.create({
            student: student._id,
            fromClass: oldClass,
            toClass: toClassId,
            academicSession,
            promotionDate: new Date(),
            promotedBy: auth.user._id,
            status: "promoted",
            remarks: remarks || "Promoted to next class",
            school: schoolId,
          });
          results.push({ studentId: student._id, status: "promoted" });
        }
      }
    }

    // Update class student counts
    const allClassIds = [
      ...new Set(mappings.flatMap((m) => [m.fromClassId, m.toClassId].filter(Boolean))),
    ];
    for (const classId of allClassIds) {
      const count = await Student.countDocuments({ class: classId, isActive: true });
      await Class.findByIdAndUpdate(classId, { numberOfStudents: count });
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

