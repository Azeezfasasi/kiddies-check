import type { NextRequest } from "next/server";
/**
 * /api/billing/bills
 * Student school-fee bills for a school and term.
 */

import Class from "@/app/server/models/Class";
import Student from "@/app/server/models/Student";
import FeeStructure from "@/app/server/models/FeeStructure";
import StudentBill from "@/app/server/models/StudentBill";
import { feeRecipients } from "@/app/server/lib/billingEmails";
import {
  TERMS,
  BILL_STUDENT_FIELDS,
  authorizeSchool,
  canManageFees,
  canRecordPayments,
  jsonError,
  syncMissingBills,
} from "@/app/server/lib/billing";

/**
 * GET /api/billing/bills?schoolId=&academicSession=&term=
 * Returns every bill for the term, plus the active students whose class has
 * no fees set yet (so they can be flagged rather than silently missing).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const academicSession = searchParams.get("academicSession");
    const term = searchParams.get("term");

    const auth = await authorizeSchool(request, schoolId);
    if (auth.error) return jsonError(auth.error, auth.status);

    if (!academicSession || !(TERMS as readonly string[]).includes(term)) {
      return jsonError("academicSession and a valid term are required", 400);
    }

    await syncMissingBills(schoolId, academicSession, term, auth.user._id);

    const [classes, structures, bills] = await Promise.all([
      Class.find({ school: schoolId, isActive: true }).select("name level section").sort({ name: 1 }).lean(),
      FeeStructure.find({ school: schoolId, academicSession, term }).select("class totalAmount dueDate").lean(),
      StudentBill.find({ school: schoolId, academicSession, term })
        .select("-activity")
        .populate({
          path: "student",
          select: `${BILL_STUDENT_FIELDS} parent`,
          populate: { path: "parent", select: "firstName lastName email" },
        })
        .populate("class", "name")
        .populate("payments.recordedBy", "firstName lastName")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const classesWithFees = new Set(structures.map((s) => s.class.toString()));
    const unbilledStudents = await Student.find({
      school: schoolId,
      isActive: true,
      class: { $nin: [...classesWithFees] },
    })
      .select("firstName lastName enrollmentNo class")
      .populate("class", "name")
      .sort({ firstName: 1 })
      .lean();

    return Response.json({
      success: true,
      canManageFees: canManageFees(auth.user),
      canRecordPayments: canRecordPayments(auth.user),
      classes,
      structures,
      bills: bills
        .filter((b) => b.student)
        .map((b) => ({ ...b, canEmail: feeRecipients(b.student as unknown as Parameters<typeof feeRecipients>[0]).length > 0 })),
      unbilledStudents,
    });
  } catch (error) {
    console.error("Error fetching bills:", error);
    return jsonError("Failed to fetch bills", 500);
  }
}
