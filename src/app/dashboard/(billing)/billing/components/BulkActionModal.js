"use client";

import { useState } from "react";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";
import ModalFrame, { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ModalFrame";
import { PAYMENT_METHODS, billingRequest, feesOnly, formatCurrency, isCarriedForward, toInputDate } from "./billingUtils";

const REMINDER_COOLDOWN_MS = 12 * 60 * 60 * 1000;

const ACTION_COPY = {
  "mark-paid": {
    title: "Mark as Fully Paid",
    description: "Records a payment for each student's full outstanding balance.",
    confirm: "Mark as Paid",
    skipReason: "already paid, waived or carried forward",
  },
  "record-payment": {
    title: "Record Same Payment",
    description: "Records the same amount for every selected student. Amounts above a student's balance are capped at that balance.",
    confirm: "Record Payments",
    skipReason: "already paid, waived or carried forward",
  },
  remind: {
    title: "Send Payment Reminder",
    description: "Emails each parent/guardian their child's outstanding balance and fee breakdown.",
    confirm: "Send Reminders",
    skipReason: "not owing, no email on record, or reminded in the last 12 hours",
  },
  discount: {
    title: "Apply Discount / Scholarship",
    description: "Replaces any existing discount on the selected bills. Discounts apply to this term's fees, not brought-forward balances. Use 0 to remove.",
    confirm: "Apply Discount",
    skipReason: "carried forward to a later term",
  },
  waive: {
    title: "Waive Fees",
    description: "Waived students owe nothing for this term, including any balance brought forward. Payments already recorded are kept.",
    confirm: "Waive Fees",
    skipReason: "already waived or carried forward",
  },
  unwaive: {
    title: "Remove Fee Waiver",
    description: "The selected students will owe their fees for this term again.",
    confirm: "Remove Waiver",
    skipReason: "not waived",
  },
};

const isOwing = (b) => !b.waived && b.balance > 0 && !isCarriedForward(b);

export default function BulkActionModal({ token, schoolId, action, bills, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(toInputDate(new Date()));
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [notifyParent, setNotifyParent] = useState(true);
  const [saving, setSaving] = useState(false);

  const copy = ACTION_COPY[action];
  const isPayment = action === "mark-paid" || action === "record-payment";
  const numericAmount = Number(amount);

  const eligibleBills = bills.filter((b) => {
    switch (action) {
      case "mark-paid":
      case "record-payment":
        return isOwing(b);
      case "remind":
        return (
          isOwing(b) &&
          b.canEmail !== false &&
          !(b.lastReminderAt && Date.now() - new Date(b.lastReminderAt).getTime() < REMINDER_COOLDOWN_MS)
        );
      case "waive":
        return !b.waived && !isCarriedForward(b);
      case "unwaive":
        return b.waived;
      default:
        return !isCarriedForward(b);
    }
  });
  const eligible = eligibleBills.length;

  let projected = null;
  if (action === "mark-paid") {
    projected = eligibleBills.reduce((sum, b) => sum + b.balance, 0);
  } else if (action === "record-payment") {
    projected =
      Number.isFinite(numericAmount) && numericAmount > 0
        ? eligibleBills.reduce((sum, b) => sum + Math.min(numericAmount, b.balance), 0)
        : 0;
  } else if (action === "remind") {
    projected = eligibleBills.reduce((sum, b) => sum + b.balance, 0);
  } else if (action === "discount" && Number.isFinite(numericAmount)) {
    projected = eligibleBills.reduce(
      (sum, b) =>
        sum + (discountType === "percent" ? (feesOnly(b) * numericAmount) / 100 : Math.min(numericAmount, feesOnly(b))),
      0
    );
  }

  const needsAmount = action === "record-payment" || action === "discount";
  const needsReason = action === "waive" || (action === "discount" && numericAmount > 0);
  const amountInvalid =
    needsAmount &&
    (amount === "" ||
      !Number.isFinite(numericAmount) ||
      numericAmount < 0 ||
      (action === "record-payment" && numericAmount === 0) ||
      (discountType === "percent" && action === "discount" && numericAmount > 100));
  const disabled = saving || eligible === 0 || amountInvalid || (needsReason && !reason.trim());

  const submit = async () => {
    setSaving(true);
    try {
      const data =
        action === "remind"
          ? await billingRequest(token, "/api/billing/reminders", {
              method: "POST",
              body: JSON.stringify({ schoolId, billIds: eligibleBills.map((b) => b._id), message }),
            })
          : await billingRequest(token, "/api/billing/bills/bulk", {
              method: "POST",
              body: JSON.stringify({
                schoolId,
                action,
                billIds: bills.map((b) => b._id),
                amount: needsAmount ? numericAmount : undefined,
                discountType,
                method,
                reference,
                paidAt,
                note,
                reason,
                notifyParent,
              }),
            });
      toast.success(data.message, { duration: 6000 });
      onDone();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const projectedLabel = isPayment ? "Total to record" : action === "remind" ? "Total outstanding" : "Total discount";

  return (
    <ModalFrame
      title={copy.title}
      subtitle={`${bills.length} student${bills.length === 1 ? "" : "s"} selected`}
      onClose={onClose}
      footer={
        <>
          <button className={secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={action === "waive" ? dangerButton : primaryButton} onClick={submit} disabled={disabled}>
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {copy.confirm} ({eligible})
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600 mb-4">{copy.description}</p>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm flex flex-wrap gap-x-6 gap-y-1">
        <span>
          Will {action === "remind" ? "email" : "update"}: <strong>{eligible}</strong> of {bills.length}
        </span>
        {projected !== null && (
          <span>
            {projectedLabel}: <strong>{formatCurrency(projected)}</strong>
          </span>
        )}
        {eligible < bills.length && (
          <span className="text-gray-500 w-full text-xs">
            {bills.length - eligible} will be skipped ({copy.skipReason}).
          </span>
        )}
      </div>

      <div className="space-y-4">
        {action === "discount" && (
          <div className="grid grid-cols-2 gap-2">
            {["fixed", "percent"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDiscountType(type)}
                className={`py-2 rounded-lg border text-sm font-semibold ${
                  discountType === type ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-600"
                }`}
              >
                {type === "fixed" ? "Fixed amount (₦)" : "Percentage (%)"}
              </button>
            ))}
          </div>
        )}

        {needsAmount && (
          <div>
            <label className={labelClass}>
              {action === "discount" ? (discountType === "percent" ? "Discount (%)" : "Discount amount (₦)") : "Amount per student (₦)"}
            </label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} autoFocus />
          </div>
        )}

        {isPayment && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Payment method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Payment date</label>
                <input type="date" value={paidAt} max={toInputDate(new Date())} onChange={(e) => setPaidAt(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Reference (optional)</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Recorded via bulk update" />
            </div>
            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyParent}
                onChange={(e) => setNotifyParent(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              Email a receipt to each parent/guardian
            </label>
          </>
        )}

        {action === "remind" && (
          <div>
            <label className={labelClass}>Personal message (optional)</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={inputClass}
              placeholder="e.g. Kindly complete payment before the mid-term break. Account: 0123456789 (Crown International School)."
            />
            <p className="text-xs text-gray-500 mt-1">Added to every reminder, above the balance breakdown.</p>
          </div>
        )}

        {(action === "waive" || action === "discount") && (
          <div>
            <label className={labelClass}>
              Reason {needsReason && <span className="text-red-500">*</span>}
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={inputClass}
              placeholder={action === "waive" ? "e.g. Full scholarship" : "e.g. Sibling discount"}
            />
          </div>
        )}
      </div>
    </ModalFrame>
  );
}
