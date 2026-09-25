/**
 * /api/billing/bills/bulk
 * Apply one action to many student bills at once.
 */

import StudentBill, { computeBillTotals, roundMoney } from "@/app/server/models/StudentBill";
import { sendReceiptEmails } from "@/app/server/lib/billingEmails";
import {
  authorizeSchool,
  generateReceiptNo,
  isCarriedForward,
  isValidId,
  jsonError,
  parsePaymentInput,
  toAmount,
} from "@/app/server/lib/billing";

const MAX_BULK = 1000;
const FEE_MANAGER_ACTIONS = ["discount", "waive", "unwaive"];
const ACTIONS = ["mark-paid", "record-payment", ...FEE_MANAGER_ACTIONS];

/**
 * POST /api/billing/bills/bulk
 * { schoolId, billIds: [], action, ...options }
 *   mark-paid       — records a payment for each bill's full outstanding balance
 *   record-payment  — { amount } recorded on each bill, capped at its balance
 *   discount        — { amount, discountType: "fixed" | "percent", reason }
 *   waive           — { reason }
 *   unwaive
 * Payment actions also accept { method, reference, paidAt, note, notifyParent }
 * and email each parent a receipt unless notifyParent is false.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { schoolId, action } = body;

    const auth = await authorizeSchool(request, schoolId, {
      requireFeeManager: FEE_MANAGER_ACTIONS.includes(action),
    });
    if (auth.error) return jsonError(auth.error, auth.status);

    if (!ACTIONS.includes(action)) return jsonError("Unknown bulk action", 400);

    const billIds = [...new Set((body.billIds || []).filter(isValidId))];
    if (billIds.length === 0) return jsonError("Select at least one student", 400);
    if (billIds.length > MAX_BULK) return jsonError(`You can update at most ${MAX_BULK} bills at once`, 400);

    const reason = (body.reason || "").toString().trim().slice(0, 300);
    let paymentDetails;
    let amount;

    if (action === "mark-paid" || action === "record-payment") {
      paymentDetails = parsePaymentInput(body);
      if (paymentDetails.error) return jsonError(paymentDetails.error, 400);
    }
    if (action === "record-payment" || action === "discount") {
      amount = toAmount(body.amount);
      if (!Number.isFinite(amount) || amount < 0 || (action === "record-payment" && amount === 0)) {
        return jsonError("Enter a valid amount", 400);
      }
      if (action === "discount" && body.discountType === "percent" && amount > 100) {
        return jsonError("Percentage discount cannot exceed 100%", 400);
      }
    }
    if ((action === "waive" || (action === "discount" && amount > 0)) && !reason) {
      return jsonError("A reason is required for this action", 400);
    }

    // Scoped to schoolId so bill ids from another school are ignored.
    const bills = await StudentBill.find({ _id: { $in: billIds }, school: schoolId });

    const userId = auth.user._id;
    const summary = { updated: 0, skipped: 0, capped: 0, totalRecorded: 0, receiptsEmailed: 0 };
    const recordedPayments = [];

    for (const bill of bills) {
      // Carried-forward bills are closed; their balance lives on a later bill.
      if (isCarriedForward(bill)) {
        summary.skipped++;
        continue;
      }
      switch (action) {
        case "mark-paid":
        case "record-payment": {
          if (bill.waived || bill.balance <= 0) {
            summary.skipped++;
            continue;
          }
          const payAmount = action === "mark-paid" ? bill.balance : Math.min(amount, bill.balance);
          if (action === "record-payment" && payAmount < amount) summary.capped++;
          bill.payments.push({
            amount: payAmount,
            ...paymentDetails,
            note: paymentDetails.note || "Recorded via bulk update",
            receiptNo: generateReceiptNo(paymentDetails.paidAt),
            recordedBy: userId,
            recordedAt: new Date(),
          });
          summary.totalRecorded = roundMoney(summary.totalRecorded + payAmount);
          break;
        }
        case "discount": {
          // Discounts apply to this term's fees, not brought-forward arrears.
          const { feesAmount } = computeBillTotals(bill);
          const discount =
            body.discountType === "percent" ? roundMoney((feesAmount * amount) / 100) : Math.min(amount, feesAmount);
          bill.discount = { amount: discount, reason: discount > 0 ? reason : "" };
          bill.activity.push({
            action: "discount",
            description: discount > 0 ? `Discount of ${discount} applied (bulk): ${reason}` : "Discount removed (bulk)",
            by: userId,
          });
          break;
        }
        case "waive": {
          if (bill.waived) {
            summary.skipped++;
            continue;
          }
          bill.waived = true;
          bill.waiverReason = reason;
          bill.activity.push({ action: "waived", description: `Fees waived (bulk): ${reason}`, by: userId });
          break;
        }
        case "unwaive": {
          if (!bill.waived) {
            summary.skipped++;
            continue;
          }
          bill.waived = false;
          bill.waiverReason = "";
          bill.activity.push({ action: "unwaived", description: "Fee waiver removed (bulk)", by: userId });
          break;
        }
      }

      bill.updatedBy = userId;
      await bill.save();
      summary.updated++;
      if (action === "mark-paid" || action === "record-payment") {
        recordedPayments.push({ bill, payment: bill.payments[bill.payments.length - 1] });
      }
    }

    summary.skipped += billIds.length - bills.length;

    if (recordedPayments.length && body.notifyParent !== false) {
      const results = await sendReceiptEmails(recordedPayments);
      summary.receiptsEmailed = results.filter((r) => r.emailedTo.length).length;
    }

    const parts = [`${summary.updated} bill(s) updated`];
    if (summary.skipped) parts.push(`${summary.skipped} skipped`);
    if (summary.capped) parts.push(`${summary.capped} capped at their outstanding balance`);
    if (recordedPayments.length && body.notifyParent !== false) {
      parts.push(`${summary.receiptsEmailed} receipt(s) emailed to parents`);
    }

    return Response.json({ success: true, message: parts.join(", ") + ".", ...summary });
  } catch (error) {
    console.error("Error running bulk billing update:", error);
    return jsonError(error.message || "Failed to run bulk update", 500);
  }
}
