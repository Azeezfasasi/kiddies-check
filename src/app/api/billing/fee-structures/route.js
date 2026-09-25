/**
 * /api/billing/fee-structures
 * Class-level school fees per academic session and term.
 */

import mongoose from "mongoose";
import Class from "@/app/server/models/Class";
import Student from "@/app/server/models/Student";
import FeeStructure from "@/app/server/models/FeeStructure";
import StudentBill from "@/app/server/models/StudentBill";
import {
  TERMS,
  authorizeSchool,
  applyStructureToBills,
  canManageFees,
  syncMissingBills,
  isValidId,
  jsonError,
  toAmount,
} from "@/app/server/lib/billing";

/**
 * GET /api/billing/fee-structures?schoolId=&academicSession=&term=
 * Every active class in the school with its fee structure (or null) for the term.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");
    const academicSession = searchParams.get("academicSession");
    const term = searchParams.get("term");

    const auth = await authorizeSchool(request, schoolId);
    if (auth.error) return jsonError(auth.error, auth.status);

    if (!academicSession || !TERMS.includes(term)) {
      return jsonError("academicSession and a valid term are required", 400);
    }

    const schoolObjectId = new mongoose.Types.ObjectId(schoolId);
    const [classes, structures, studentCounts, billStats] = await Promise.all([
      Class.find({ school: schoolId, isActive: true }).select("name level section").sort({ name: 1 }).lean(),
      FeeStructure.find({ school: schoolId, academicSession, term })
        .populate("updatedBy", "firstName lastName")
        .lean(),
      Student.aggregate([
        { $match: { school: schoolObjectId, isActive: true } },
        { $group: { _id: "$class", count: { $sum: 1 } } },
      ]),
      StudentBill.aggregate([
        {
          $match: {
            school: schoolObjectId,
            academicSession,
            term,
          },
        },
        {
          $group: {
            _id: "$feeStructure",
            bills: { $sum: 1 },
            collected: { $sum: "$amountPaid" },
          },
        },
      ]),
    ]);

    const structureByClass = new Map(structures.map((s) => [s.class.toString(), s]));
    const countByClass = new Map(studentCounts.map((c) => [String(c._id), c.count]));
    const statsByStructure = new Map(billStats.map((b) => [String(b._id), b]));

    return Response.json({
      success: true,
      canManageFees: canManageFees(auth.user),
      classes: classes.map((cls) => {
        const structure = structureByClass.get(cls._id.toString()) || null;
        const stats = structure ? statsByStructure.get(structure._id.toString()) : null;
        return {
          class: cls,
          studentCount: countByClass.get(cls._id.toString()) || 0,
          structure,
          billCount: stats?.bills || 0,
          collected: stats?.collected || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return jsonError("Failed to fetch fee structures", 500);
  }
}

/**
 * POST /api/billing/fee-structures
 * Set fees:  { schoolId, academicSession, term, classIds: [], items: [{ name, amount }], dueDate, notes }
 * Copy term: { action: "copy", schoolId, fromSession, fromTerm, academicSession, term, overwrite }
 * Saving a structure regenerates bills for every active student in the class.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { schoolId, academicSession, term } = body;

    const auth = await authorizeSchool(request, schoolId, { requireFeeManager: true });
    if (auth.error) return jsonError(auth.error, auth.status);

    if (!academicSession?.trim() || !TERMS.includes(term)) {
      return jsonError("academicSession and a valid term are required", 400);
    }

    if (body.action === "copy") {
      return copyStructures(auth.user, body);
    }

    const classIds = [...new Set((body.classIds || []).filter(isValidId))];
    if (classIds.length === 0) return jsonError("Select at least one class", 400);

    const items = (body.items || [])
      .map((i) => ({ name: (i.name || "").toString().trim().slice(0, 100), amount: toAmount(i.amount) }))
      .filter((i) => i.name);
    if (items.length === 0) return jsonError("Add at least one fee item", 400);
    if (items.some((i) => !Number.isFinite(i.amount) || i.amount < 0)) {
      return jsonError("Fee amounts must be valid, non-negative numbers", 400);
    }
    if (items.reduce((sum, i) => sum + i.amount, 0) <= 0) {
      return jsonError("Total fees must be greater than zero", 400);
    }

    let dueDate;
    if (body.dueDate) {
      dueDate = new Date(body.dueDate);
      if (Number.isNaN(dueDate.getTime())) return jsonError("Invalid due date", 400);
    }

    const validClassCount = await Class.countDocuments({ _id: { $in: classIds }, school: schoolId });
    if (validClassCount !== classIds.length) {
      return jsonError("One or more classes do not belong to this school", 400);
    }

    let billsUpdated = 0;
    for (const classId of classIds) {
      let structure = await FeeStructure.findOne({ school: schoolId, class: classId, academicSession, term });
      if (!structure) {
        structure = new FeeStructure({
          school: schoolId,
          class: classId,
          academicSession,
          term,
          createdBy: auth.user._id,
        });
      }
      structure.items = items;
      structure.dueDate = dueDate;
      structure.notes = (body.notes || "").toString().trim().slice(0, 500);
      structure.updatedBy = auth.user._id;
      await structure.save();
      billsUpdated += await applyStructureToBills(structure, auth.user._id);
    }

    const billsCreated = await syncMissingBills(schoolId, academicSession, term, auth.user._id);

    return Response.json({
      success: true,
      message: `Fees saved for ${classIds.length} class${classIds.length > 1 ? "es" : ""}. ${billsCreated} bill(s) created, ${billsUpdated} updated.`,
      billsCreated,
      billsUpdated,
    });
  } catch (error) {
    console.error("Error saving fee structure:", error);
    return jsonError(error.message || "Failed to save fee structure", 500);
  }
}

async function copyStructures(user, body) {
  const { schoolId, fromSession, fromTerm, academicSession, term, overwrite } = body;
  if (!fromSession || !TERMS.includes(fromTerm)) {
    return jsonError("Select the session and term to copy from", 400);
  }
  if (fromSession === academicSession && fromTerm === term) {
    return jsonError("Source and destination terms are the same", 400);
  }

  const source = await FeeStructure.find({ school: schoolId, academicSession: fromSession, term: fromTerm });
  if (source.length === 0) return jsonError("No fees were set for the selected source term", 404);

  let copied = 0;
  let skipped = 0;
  let billsUpdated = 0;
  for (const src of source) {
    let structure = await FeeStructure.findOne({ school: schoolId, class: src.class, academicSession, term });
    if (structure && !overwrite) {
      skipped++;
      continue;
    }
    if (!structure) {
      structure = new FeeStructure({ school: schoolId, class: src.class, academicSession, term, createdBy: user._id });
    }
    structure.items = src.items.map((i) => ({ name: i.name, amount: i.amount }));
    structure.notes = src.notes;
    // The old due date belongs to the old term, so it isn't carried over.
    structure.dueDate = structure.isNew ? undefined : structure.dueDate;
    structure.updatedBy = user._id;
    await structure.save();
    billsUpdated += await applyStructureToBills(structure, user._id);
    copied++;
  }

  const billsCreated = await syncMissingBills(schoolId, academicSession, term, user._id);

  return Response.json({
    success: true,
    message: `Copied fees for ${copied} class(es)${skipped ? `, skipped ${skipped} already set` : ""}. ${billsCreated} bill(s) created.`,
    copied,
    skipped,
    billsCreated,
    billsUpdated,
  });
}
