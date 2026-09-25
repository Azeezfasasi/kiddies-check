/**
 * /api/billing/bills/[id]/payments
 */

import StudentBill from "@/app/server/models/StudentBill";
import { sendReceiptEmails } from "@/app/server/lib/billingEmails";
import {
  carriedForwardMessage,
  checkSchoolAccess,
  isCarriedForward,
  generateReceiptNo,
  isValidId,
  jsonError,
  parsePaymentInput,
  toAmount,
  verifyBillingUser,
} from "@/app/server/lib/billing";

/**
 * POST /api/billing/bills/[id]/payments
 * Records a manual payment (cash, transfer, POS...). Body:
 * { amount, method, reference, paidAt, note, notifyParent } or { payFullBalance: true, ... }
 * Payments larger than the outstanding balance are rejected. Unless
 * notifyParent is false, the receipt is emailed to the parent/guardian.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!isValidId(id)) return jsonError("Invalid bill id", 400);

    const auth = await verifyBillingUser(request);
    if (auth.error) return jsonError(auth.error, auth.status);

    const bill = await StudentBill.findById(id);
    if (!bill) return jsonError("Bill not found", 404);

    const denied = await checkSchoolAccess(auth.user, bill.school);
    if (denied) return jsonError(denied.error, denied.status);

    if (isCarriedForward(bill)) return jsonError(carriedForwardMessage(bill), 400);
    if (bill.waived) return jsonError("Fees for this student have been waived", 400);
    if (bill.balance <= 0) return jsonError("This bill is already fully paid", 400);

    const body = await request.json();
    const amount = body.payFullBalance ? bill.balance : toAmount(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) return jsonError("Enter a valid payment amount", 400);
    if (amount > bill.balance) {
      return jsonError(`Amount exceeds the outstanding balance of ${bill.balance}`, 400);
    }

    const details = parsePaymentInput(body);
    if (details.error) return jsonError(details.error, 400);

    bill.payments.push({
      amount,
      ...details,
      receiptNo: generateReceiptNo(details.paidAt),
      recordedBy: auth.user._id,
      recordedAt: new Date(),
    });
    bill.updatedBy = auth.user._id;
    await bill.save();

    const payment = bill.payments[bill.payments.length - 1];

    let email = null;
    if (body.notifyParent !== false) {
      [email] = await sendReceiptEmails([{ bill, payment }]);
      if (email.emailedTo.length) payment.receiptEmailedTo = email.emailedTo;
    }

    return Response.json({
      success: true,
      message: `Payment of ${amount} recorded. Receipt ${payment.receiptNo}.`,
      payment,
      email,
      bill: {
        _id: bill._id,
        amountPaid: bill.amountPaid,
        balance: bill.balance,
        status: bill.status,
      },
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return jsonError(error.message || "Failed to record payment", 500);
  }
}
