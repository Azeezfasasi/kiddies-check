import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { connectDB } from "@/app/server/db/connect";
import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";
import Student from "@/app/server/models/Student";
import FeeStructure from "@/app/server/models/FeeStructure";
import StudentBill, { computeBillTotals } from "@/app/server/models/StudentBill";
import { can } from "@/utils/roles";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Who can view bills and record payments.
export const BILLING_ROLES = ["admin", "school-leader", "learning-specialist"];
// Who can set class fees, give discounts, waive fees and void payments.
export const FEE_MANAGER_ROLES = ["admin", "school-leader"];

export const TERMS = ["first", "second", "third"];
export const PAYMENT_METHODS = ["cash", "bank-transfer", "pos", "cheque", "online", "other"];

// Platform roles get billing through the shared permission map: "view" to
// see bills, "edit" to record payments/send reminders, "manage" for fees.
export const canViewBilling = (user) => BILLING_ROLES.includes(user?.role) || can(user?.role, "billing", "view");
export const canRecordPayments = (user) => BILLING_ROLES.includes(user?.role) || can(user?.role, "billing", "edit");
export const canManageFees = (user) => FEE_MANAGER_ROLES.includes(user?.role) || can(user?.role, "billing", "manage");

export const jsonError = (message, status) =>
  Response.json({ success: false, message }, { status });

export const isValidId = (id) => !!id && mongoose.isValidObjectId(id);

export async function verifyBillingUser(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { error: "Unauthorized: Invalid token", status: 401 };
    }

    const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return { error: "Unauthorized: Invalid token", status: 401 };
    }
    if (!canViewBilling(user)) {
      return { error: "Forbidden: Insufficient permissions", status: 403 };
    }
    return { user };
  } catch (error) {
    return { error: "Unauthorized: Invalid token", status: 401 };
  }
}

// Same rule as grade promotion: admins can act on any school; everyone else
// must belong to (or manage) that specific school.
export async function verifySchoolScope(user, schoolId) {
  if (!isValidId(schoolId)) return false;
  if (user.role === "admin" || can(user.role, "billing")) return true;
  if (user.schoolId && user.schoolId.toString() === schoolId.toString()) return true;
  if (user.managedSchools?.some((id) => id.toString() === schoolId.toString())) return true;

  const membership = await SchoolMember.findOne({
    user: user._id,
    school: schoolId,
    role: { $in: ["school-leader", "learning-specialist"] },
    status: "active",
  });
  return !!membership;
}

// Checks an already-authenticated user can act on schoolId. Returns an
// { error, status } object on failure, or null when allowed.
export async function checkSchoolAccess(user, schoolId, { requireFeeManager = false, requireRecorder = false } = {}) {
  if (requireFeeManager && !canManageFees(user)) {
    return { error: "Only admins, school leaders and school directors can perform this action", status: 403 };
  }
  if (requireRecorder && !canRecordPayments(user)) {
    return { error: "Your role has view-only access to billing", status: 403 };
  }
  if (!isValidId(schoolId)) return { error: "A valid schoolId is required", status: 400 };
  if (!(await verifySchoolScope(user, schoolId))) {
    return { error: "Forbidden: You do not have access to this school", status: 403 };
  }
  return null;
}

// Authenticates the request and checks the caller can act on schoolId.
export async function authorizeSchool(req, schoolId, options) {
  const auth = await verifyBillingUser(req);
  if (auth.error) return auth;
  const denied = await checkSchoolAccess(auth.user, schoolId, options);
  return denied || auth;
}

export function generateReceiptNo(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `RCT-${stamp}-${suffix}`;
}

export const toAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

// Parses a payment payload shared by single and bulk payment endpoints.
export function parsePaymentInput(body) {
  const method = PAYMENT_METHODS.includes(body.method) ? body.method : "cash";
  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) return { error: "Invalid payment date" };
  if (paidAt > new Date(Date.now() + 24 * 60 * 60 * 1000)) {
    return { error: "Payment date cannot be in the future" };
  }
  return {
    method,
    paidAt,
    reference: (body.reference || "").toString().trim().slice(0, 120),
    note: (body.note || "").toString().trim().slice(0, 500),
  };
}

function buildBillFromStructure(structure, studentId, userId) {
  const bill = {
    _id: new mongoose.Types.ObjectId(),
    school: structure.school,
    student: studentId,
    class: structure.class,
    feeStructure: structure._id,
    academicSession: structure.academicSession,
    term: structure.term,
    items: structure.items.map((i) => ({ name: i.name, amount: i.amount })),
    discount: { amount: 0 },
    payments: [],
    dueDate: structure.dueDate,
    activity: [
      {
        action: "created",
        description: "Bill generated from class fee structure",
        by: userId,
        at: new Date(),
      },
    ],
  };
  const totals = computeBillTotals(bill);
  return { ...bill, ...totals, lastPaymentAt: undefined };
}

// Creates bills for active students in classes that have a fee structure
// for this term but no bill yet (e.g. students added after fees were set).
export async function syncMissingBills(schoolId, academicSession, term, userId) {
  const structures = await FeeStructure.find({ school: schoolId, academicSession, term });
  if (structures.length === 0) return 0;

  const structureByClass = new Map(structures.map((s) => [s.class.toString(), s]));
  const students = await Student.find({
    school: schoolId,
    class: { $in: [...structureByClass.keys()] },
    isActive: true,
  })
    .select("_id class")
    .lean();
  if (students.length === 0) return 0;

  const billed = await StudentBill.find({
    student: { $in: students.map((s) => s._id) },
    academicSession,
    term,
  })
    .select("student")
    .lean();
  const billedIds = new Set(billed.map((b) => b.student.toString()));

  const docs = students
    .filter((s) => !billedIds.has(s._id.toString()))
    .map((s) => buildBillFromStructure(structureByClass.get(s.class.toString()), s._id, userId));
  if (docs.length === 0) return 0;

  try {
    await StudentBill.insertMany(docs, { ordered: false });
  } catch (error) {
    // A concurrent request may have created some of the same bills — the
    // unique index rejects the duplicates and the rest still insert.
    if (error.code !== 11000 && !error.writeErrors?.every((e) => e.code === 11000)) throw error;
  }

  // Only the bills this call actually inserted pull in earlier arrears, so
  // a concurrent duplicate can never carry the same balance twice.
  const inserted = await StudentBill.find({ _id: { $in: docs.map((d) => d._id) } });
  await carryBalancesInto(inserted, userId);
  return inserted.length;
}

const TERM_ORDER = { first: 0, second: 1, third: 2 };

// Sessions are "YYYY/YYYY" strings, so they compare correctly as text.
export const isEarlierTerm = (session, term, thanSession, thanTerm) =>
  session < thanSession || (session === thanSession && TERM_ORDER[term] < TERM_ORDER[thanTerm]);

export const termLabel = (term, session) =>
  `${term ? term.charAt(0).toUpperCase() + term.slice(1) : ""} Term ${session || ""}`.trim();

/**
 * Moves each student's unpaid balances from earlier terms into the given
 * bills as "brought forward" arrears. The earlier bill is marked as carried
 * forward, which zeroes its balance, so the debt only ever lives on one bill.
 * Waived target bills are skipped so arrears aren't silently forgiven.
 */
export async function carryBalancesInto(bills, userId) {
  const targets = bills.filter((b) => !b.waived);
  if (targets.length === 0) return { carried: 0, amount: 0 };

  const previous = await StudentBill.find({
    student: { $in: targets.map((b) => b.student) },
    _id: { $nin: targets.map((b) => b._id) },
    balance: { $gt: 0 },
    waived: { $ne: true },
    "carriedForward.amount": { $not: { $gt: 0 } },
  });

  const byStudent = new Map();
  for (const prev of previous) {
    const key = prev.student.toString();
    if (!byStudent.has(key)) byStudent.set(key, []);
    byStudent.get(key).push(prev);
  }

  let carried = 0;
  let amount = 0;
  for (const bill of targets) {
    const earlier = (byStudent.get(bill.student.toString()) || [])
      .filter((p) => isEarlierTerm(p.academicSession, p.term, bill.academicSession, bill.term))
      .sort((a, b) => (isEarlierTerm(a.academicSession, a.term, b.academicSession, b.term) ? -1 : 1));
    if (earlier.length === 0) continue;

    for (const prev of earlier) {
      bill.arrears.push({ bill: prev._id, academicSession: prev.academicSession, term: prev.term, amount: prev.balance });
      bill.activity.push({
        action: "arrears-added",
        description: `Outstanding balance of ${prev.balance} brought forward from ${termLabel(prev.term, prev.academicSession)}`,
        by: userId,
      });
    }
    bill.updatedBy = userId;
    // Save the new bill first: if marking the old bills then fails, the debt
    // shows twice (visible and fixable) rather than disappearing.
    await bill.save();

    for (const prev of earlier) {
      amount += prev.balance;
      prev.carriedForward = {
        amount: prev.balance,
        toBill: bill._id,
        academicSession: bill.academicSession,
        term: bill.term,
        at: new Date(),
      };
      prev.activity.push({
        action: "carried-forward",
        description: `Outstanding balance of ${prev.balance} carried forward to ${termLabel(bill.term, bill.academicSession)}`,
        by: userId,
      });
      prev.updatedBy = userId;
      await prev.save();
    }
    carried++;
  }
  return { carried, amount };
}

// Reverses carryBalancesInto for bills that are about to be deleted, so the
// balances return to the bills they came from.
export async function releaseArrears(bills, userId) {
  for (const bill of bills) {
    for (const entry of bill.arrears || []) {
      const source = await StudentBill.findById(entry.bill);
      if (!source || source.carriedForward?.toBill?.toString() !== bill._id.toString()) continue;
      source.carriedForward = { amount: 0 };
      source.activity.push({
        action: "carry-reversed",
        description: `Carried-forward balance returned because the ${termLabel(bill.term, bill.academicSession)} bill was removed`,
        by: userId,
      });
      await source.save();
    }
  }
}

export const isCarriedForward = (bill) => (bill.carriedForward?.amount || 0) > 0;

export const carriedForwardMessage = (bill) =>
  `This balance was carried forward to the ${termLabel(bill.carriedForward.term, bill.carriedForward.academicSession)} bill. Make changes there instead.`;

// Pushes an edited fee structure onto the bills already generated from it,
// keeping each bill's discount and payments intact.
export async function applyStructureToBills(structure, userId) {
  const bills = await StudentBill.find({ feeStructure: structure._id });
  const newItems = structure.items.map((i) => ({ name: i.name, amount: i.amount }));
  const itemsKey = JSON.stringify(newItems);

  let updated = 0;
  for (const bill of bills) {
    const oldItemsKey = JSON.stringify(bill.items.map((i) => ({ name: i.name, amount: i.amount })));
    const dueChanged = String(bill.dueDate || "") !== String(structure.dueDate || "");
    if (oldItemsKey === itemsKey && !dueChanged) continue;

    if (oldItemsKey !== itemsKey) {
      const oldTotal = bill.feesAmount;
      bill.items = newItems;
      bill.activity.push({
        action: "fees-updated",
        description: `Class fees changed from ${oldTotal} to ${structure.totalAmount}`,
        by: userId,
      });
    }
    bill.dueDate = structure.dueDate;
    bill.updatedBy = userId;
    await bill.save();
    updated++;
  }
  return updated;
}

export const BILL_STUDENT_FIELDS = "firstName lastName enrollmentNo isActive guardian picture class";
