"use client";

import { useState } from "react";
import { CheckCircle, Loader, Mail, Printer } from "lucide-react";
import toast from "react-hot-toast";
import ModalFrame, { inputClass, labelClass, primaryButton, secondaryButton } from "./ModalFrame";
import {
  PAYMENT_METHODS,
  TERM_LABELS,
  billingRequest,
  formatCurrency,
  printReceipt,
  studentName,
  toInputDate,
} from "./billingUtils";

export default function RecordPaymentModal({ token, bill, schoolName, onClose, onRecorded }) {
  const [amount, setAmount] = useState(String(bill.balance));
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(toInputDate(new Date()));
  const [note, setNote] = useState("");
  const [notifyParent, setNotifyParent] = useState(bill.canEmail !== false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const numericAmount = Number(amount);
  const invalid = !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > bill.balance;
  const remaining = Math.max(bill.balance - (Number.isFinite(numericAmount) ? numericAmount : 0), 0);

  const submit = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const data = await billingRequest(token, `/api/billing/bills/${bill._id}/payments`, {
        method: "POST",
        body: JSON.stringify({ amount: numericAmount, method, reference, paidAt, note, notifyParent }),
      });
      toast.success("Payment recorded");
      setResult(data);
      onRecorded?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const subtitle = `${studentName(bill.student)} · ${bill.class?.name || ""} · ${TERM_LABELS[bill.term]} ${bill.academicSession}`;

  if (result) {
    return (
      <ModalFrame
        title="Payment recorded"
        subtitle={subtitle}
        onClose={onClose}
        footer={
          <>
            <button
              className={secondaryButton}
              onClick={() =>
                printReceipt({ schoolName, bill, payment: result.payment, balanceAfter: result.bill.balance }) ||
                toast.error("Allow pop-ups to print the receipt")
              }
            >
              <Printer className="w-4 h-4" /> Print Receipt
            </button>
            <button className={primaryButton} onClick={onClose}>
              Done
            </button>
          </>
        }
      >
        <div className="text-center py-4">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
          <p className="text-2xl font-bold text-gray-800 mt-3">{formatCurrency(result.payment.amount)}</p>
          <p className="text-sm text-gray-500 mt-1">Receipt {result.payment.receiptNo}</p>
          <p className="text-sm mt-4">
            Outstanding balance:{" "}
            <span className={`font-semibold ${result.bill.balance > 0 ? "text-red-600" : "text-green-600"}`}>
              {formatCurrency(Math.max(result.bill.balance, 0))}
            </span>
          </p>
          {result.email && (
            <p
              className={`inline-flex items-center gap-1.5 text-xs mt-4 px-3 py-1.5 rounded-full ${
                result.email.emailedTo.length ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              {result.email.emailedTo.length
                ? `Receipt emailed to ${result.email.emailedTo.join(", ")}`
                : `Receipt not emailed: ${result.email.error}`}
            </p>
          )}
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      title="Record Payment"
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <>
          <button className={secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={primaryButton} onClick={submit} disabled={saving || invalid}>
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            Record {Number.isFinite(numericAmount) && numericAmount > 0 ? formatCurrency(numericAmount) : "Payment"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-5 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Fees</p>
          <p className="font-bold text-gray-800">{formatCurrency(bill.netAmount)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="font-bold text-green-700">{formatCurrency(bill.amountPaid)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Balance</p>
          <p className="font-bold text-red-700">{formatCurrency(bill.balance)}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass.replace(" mb-1", "")}>Amount received (₦)</label>
            <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={() => setAmount(String(bill.balance))}>
              Pay full balance
            </button>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            autoFocus
          />
          {numericAmount > bill.balance ? (
            <p className="text-xs text-red-600 mt-1">Amount cannot exceed the outstanding balance.</p>
          ) : (
            !invalid && <p className="text-xs text-gray-500 mt-1">Balance after this payment: {formatCurrency(remaining)}</p>
          )}
        </div>
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
          <label className={labelClass}>Reference / Teller no. (optional)</label>
          <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} placeholder="e.g. bank transfer reference" />
        </div>
        <div>
          <label className={labelClass}>Note (optional)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} placeholder="e.g. Paid by father at the bursary" />
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyParent}
            onChange={(e) => setNotifyParent(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-gray-300"
          />
          <span>
            Email receipt to parent/guardian
            {bill.canEmail === false && (
              <span className="block text-xs text-amber-600">No parent or guardian email is on record for this student.</span>
            )}
          </span>
        </label>
      </div>
    </ModalFrame>
  );
}
