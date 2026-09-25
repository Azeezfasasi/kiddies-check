/**
 * /api/billing/bills/[id]
 */

import StudentBill, { computeBillTotals } from "@/app/server/models/StudentBill";
import {
  BILL_STUDENT_FIELDS,
  canManageFees,
  carriedForwardMessage,
  checkSchoolAccess,
  isCarriedForward,
  isValidId,
  jsonError,
  toAmount,
  verifyBillingUser,
} from "@/app/server/lib/billing";

const populateBill = (query) =>
  query
    .populate("student", BILL_STUDENT_FIELDS)
    .populate("class", "name")
    .populate("payments.recordedBy", "firstName lastName")
    .populate("payments.voidedBy", "firstName lastName")
    .populate("activity.by", "firstName lastName")
    .populate("reminders.sentBy", "firstName lastName")
    .populate("updatedBy", "firstName lastName");

/**
 * GET /api/billing/bills/[id]
 * Full bill with its payment ledger, audit trail and the student's billing
 * history across all terms.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!isValidId(id)) return jsonError("Invalid bill id", 400);

    const auth = await verifyBillingUser(request);
    if (auth.error) return jsonError(auth.error, auth.status);

    const bill = await populateBill(StudentBill.findById(id)).lean();
    if (!bill) return jsonError("Bill not found", 404);

    const denied = await checkSchoolAccess(auth.user, bill.school);
    if (denied) return jsonError(denied.error, denied.status);

    const history = await StudentBill.find({ student: bill.student?._id || bill.student })
      .select("academicSession term class netAmount arrearsAmount amountPaid balance status waived carriedForward")
      .populate("class", "name")
      .sort({ academicSession: -1, term: -1 })
      .lean();

    const totalOutstanding = history.reduce((sum, b) => sum + Math.max(b.balance, 0), 0);

    return Response.json({
      success: true,
      canManageFees: canManageFees(auth.user),
      bill,
      history,
      totalOutstanding,
    });
  } catch (error) {
    console.error("Error fetching bill:", error);
    return jsonError("Failed to fetch bill", 500);
  }
}

/**
 * PATCH /api/billing/bills/[id]
 * { action: "discount", amount, reason }        — admin / school leader
 * { action: "waive", reason } | { action: "unwaive" } — admin / school leader
 * { action: "void-payment", paymentId, reason } — admin / school leader
 * { action: "update", notes, dueDate }          — any billing role
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!isValidId(id)) return jsonError("Invalid bill id", 400);

    const auth = await verifyBillingUser(request);
    if (auth.error) return jsonError(auth.error, auth.status);

    const body = await request.json();
    const bill = await StudentBill.findById(id);
    if (!bill) return jsonError("Bill not found", 404);

    const denied = await checkSchoolAccess(auth.user, bill.school, { requireFeeManager: body.action !== "update" });
    if (denied) return jsonError(denied.error, denied.status);

    // A carried-forward bill is closed: its balance now lives on a later
    // bill, so money changes here would make the two disagree.
    if (body.action !== "update" && isCarriedForward(bill)) {
      return jsonError(carriedForwardMessage(bill), 400);
    }

    const userId = auth.user._id;
    const reason = (body.reason || "").toString().trim().slice(0, 300);

    switch (body.action) {
      case "discount": {
        const amount = toAmount(body.amount);
        const { feesAmount } = computeBillTotals(bill);
        if (!Number.isFinite(amount) || amount < 0) return jsonError("Enter a valid discount amount", 400);
        if (amount > feesAmount) return jsonError("Discount cannot exceed this term's fees", 400);
        if (amount > 0 && !reason) return jsonError("A reason is required for a discount", 400);
        bill.discount = { amount, reason: amount > 0 ? reason : "" };
        bill.activity.push({
          action: "discount",
          description: amount > 0 ? `Discount of ${amount} applied: ${reason}` : "Discount removed",
          by: userId,
        });
        break;
      }
      case "waive": {
        if (!reason) return jsonError("A reason is required to waive fees", 400);
        bill.waived = true;
        bill.waiverReason = reason;
        bill.activity.push({ action: "waived", description: `Fees waived: ${reason}`, by: userId });
        break;
      }
      case "unwaive": {
        bill.waived = false;
        bill.waiverReason = "";
        bill.activity.push({ action: "unwaived", description: "Fee waiver removed", by: userId });
        break;
      }
      case "void-payment": {
        const payment = bill.payments.id(body.paymentId);
        if (!payment) return jsonError("Payment not found", 404);
        if (payment.voided) return jsonError("Payment is already voided", 400);
        if (!reason) return jsonError("A reason is required to void a payment", 400);
        payment.voided = true;
        payment.voidReason = reason;
        payment.voidedBy = userId;
        payment.voidedAt = new Date();
        bill.activity.push({
          action: "payment-voided",
          description: `Payment ${payment.receiptNo} of ${payment.amount} voided: ${reason}`,
          by: userId,
        });
        break;
      }
      case "update": {
        if (body.notes !== undefined) bill.notes = body.notes.toString().trim().slice(0, 1000);
        if (body.dueDate !== undefined) {
          const due = body.dueDate ? new Date(body.dueDate) : undefined;
          if (due && Number.isNaN(due.getTime())) return jsonError("Invalid due date", 400);
          bill.dueDate = due;
        }
        bill.activity.push({ action: "updated", description: "Bill notes/due date updated", by: userId });
        break;
      }
      default:
        return jsonError("Unknown action", 400);
    }

    bill.updatedBy = userId;
    await bill.save();

    const updated = await populateBill(StudentBill.findById(bill._id)).lean();
    return Response.json({ success: true, message: "Bill updated", bill: updated });
  } catch (error) {
    console.error("Error updating bill:", error);
    return jsonError(error.message || "Failed to update bill", 500);
  }
}
