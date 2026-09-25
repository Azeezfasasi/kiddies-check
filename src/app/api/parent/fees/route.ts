import type { NextRequest } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { connectDB } from "@/app/server/db/connect";
import User from "@/app/server/models/User";
import Student from "@/app/server/models/Student";
import School from "@/app/server/models/School";
import StudentBill from "@/app/server/models/StudentBill";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TERM_ORDER = { first: 0, second: 1, third: 2 };

/**
 * GET /api/parent/fees?studentId=
 * Read-only school-fee bills for the signed-in parent's own children.
 * Authenticated by the bearer token (not a client-supplied user id), and
 * internal fields — staff notes, audit trail, who recorded payments — are
 * left out.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
    } catch {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.id).select("role isActive");
    if (!user || !user.isActive || user.role !== "parent") {
      return Response.json({ success: false, message: "Only parents can access this resource" }, { status: 403 });
    }

    const studentId = req.nextUrl.searchParams.get("studentId");
    const childQuery: Record<string, unknown> = { parent: user._id };
    if (studentId) {
      if (!mongoose.isValidObjectId(studentId)) {
        return Response.json({ success: false, message: "Invalid student" }, { status: 400 });
      }
      childQuery._id = studentId;
    }
    const children = await Student.find(childQuery).select("_id school").lean();
    if (children.length === 0) {
      return Response.json({ success: true, bills: [], totalOutstanding: 0, schools: {} });
    }

    const bills = await StudentBill.find({ student: { $in: children.map((c) => c._id) } })
      .select(
        "student school class academicSession term items arrears discount feesAmount arrearsAmount netAmount amountPaid balance status waived dueDate carriedForward payments"
      )
      .populate("student", "firstName lastName enrollmentNo")
      .populate("class", "name")
      .lean();

    const schools = await School.find({ _id: { $in: [...new Set(bills.map((b) => String(b.school)))] } })
      .select("name email phone")
      .lean();

    const safeBills = bills
      .map((b) => ({
        ...b,
        payments: (b.payments || [])
          .filter((p) => !p.voided)
          .map(({ _id, amount, method, reference, receiptNo, paidAt }) => ({ _id, amount, method, reference, receiptNo, paidAt })),
      }))
      .sort((a, b) =>
        a.academicSession === b.academicSession
          ? TERM_ORDER[b.term] - TERM_ORDER[a.term]
          : b.academicSession.localeCompare(a.academicSession)
      );

    const totalOutstanding = safeBills.reduce((sum, b) => sum + (b.waived ? 0 : Math.max(b.balance, 0)), 0);

    return Response.json({
      success: true,
      bills: safeBills,
      totalOutstanding,
      schools: Object.fromEntries(schools.map((s) => [String(s._id), s])),
    });
  } catch (error) {
    console.error("[Parent Fees Error]", error);
    return Response.json({ success: false, message: "Failed to load fees" }, { status: 500 });
  }
}
