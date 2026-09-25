"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, Ban, BadgePercent, Bell, History, Loader, Mail, Pencil, Phone, Plus, Printer, ReceiptText, Undo2 } from "lucide-react";
import toast from "react-hot-toast";
import ModalFrame, { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ModalFrame";
import { StatusBadge } from "./BillingShell";
import {
  TERM_LABELS,
  balanceAfterPayment,
  billingRequest,
  feesOnly,
  formatCurrency,
  formatDate,
  isCarriedForward,
  isOverdue,
  methodLabel,
  printReceipt,
  studentName,
  timeAgo,
  toInputDate,
} from "./billingUtils";

const personName = (p) => (p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : "—");

export default function BillDetailModal({ token, billId, schoolName, onClose, onChanged, onRecordPayment }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      const res = await billingRequest(token, `/api/billing/bills/${billId}`);
      setData(res);
    } catch (error) {
      toast.error(error.message);
      onClose();
    } finally {
      setLoading(false);
    }
  }, [token, billId, onClose]);

  useEffect(() => {
    load();
  }, [load]);

  const openPanel = (name, initial = {}) => {
    setPanel(name);
    setForm(initial);
  };

  const patch = async (payload, successMessage) => {
    setSaving(true);
    try {
      await billingRequest(token, `/api/billing/bills/${billId}`, { method: "PATCH", body: JSON.stringify(payload) });
      toast.success(successMessage);
      setPanel(null);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = async () => {
    setSaving(true);
    try {
      const res = await billingRequest(token, "/api/billing/reminders", {
        method: "POST",
        body: JSON.stringify({ schoolId: data.bill.school, billIds: [billId] }),
      });
      if (res.sent) toast.success("Reminder emailed to parent");
      else toast.error(res.message);
      await load();
      onChanged?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <ModalFrame title="Bill details" onClose={onClose} size="lg">
        <div className="flex justify-center py-16">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </ModalFrame>
    );
  }

  const { bill, history, totalOutstanding, canManageFees } = data;
  // Older responses predate this flag; the server still enforces it.
  const canRecord = data.canRecordPayments !== false;
  const overdue = isOverdue(bill);
  const payments = [...bill.payments].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
  const guardian = bill.student?.guardian;
  const carried = isCarriedForward(bill);
  const owing = canRecord && !bill.waived && !carried && bill.balance > 0;
  const lastReminder = bill.reminders?.length ? bill.reminders[bill.reminders.length - 1] : null;

  return (
    <ModalFrame
      title={studentName(bill.student)}
      subtitle={`${bill.student?.enrollmentNo ? bill.student.enrollmentNo + " · " : ""}${bill.class?.name || ""} · ${TERM_LABELS[bill.term]} ${bill.academicSession}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className={secondaryButton} onClick={onClose}>
            Close
          </button>
          {owing && (
            <button className={secondaryButton} onClick={sendReminder} disabled={saving}>
              <Bell className="w-4 h-4" /> Send Reminder
            </button>
          )}
          {owing && (
            <button className={primaryButton} onClick={() => onRecordPayment(bill)}>
              <Plus className="w-4 h-4" /> Record Payment
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StatusBadge status={bill.status} />
        {overdue && <StatusBadge status="overdue" />}
        {bill.dueDate && <span className="text-xs text-gray-500">Due {formatDate(bill.dueDate)}</span>}
        {guardian?.phone && (
          <a href={`tel:${guardian.phone}`} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
            <Phone className="w-3.5 h-3.5" /> {guardian.name ? `${guardian.name}: ` : ""}
            {guardian.phone}
          </a>
        )}
      </div>

      {/* Fee breakdown */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-100">
            {(bill.arrears || []).map((a) => (
              <tr key={a.bill} className="bg-violet-50/50">
                <td className="px-4 py-2 text-violet-700">
                  Balance brought forward — {TERM_LABELS[a.term]} {a.academicSession}
                </td>
                <td className="px-4 py-2 text-right text-violet-700">{formatCurrency(a.amount)}</td>
              </tr>
            ))}
            {bill.items.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 text-gray-600">{item.name}</td>
                <td className="px-4 py-2 text-right text-gray-800">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
            {bill.discount?.amount > 0 && (
              <tr className="bg-sky-50/50">
                <td className="px-4 py-2 text-sky-700">Discount{bill.discount.reason ? ` — ${bill.discount.reason}` : ""}</td>
                <td className="px-4 py-2 text-right text-sky-700">−{formatCurrency(bill.discount.amount)}</td>
              </tr>
            )}
            <tr className="bg-gray-50 font-semibold">
              <td className="px-4 py-2">{bill.arrearsAmount > 0 ? "Total due (incl. arrears)" : "Total fees"}</td>
              <td className="px-4 py-2 text-right">{formatCurrency(bill.netAmount)}</td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-green-700">Amount paid</td>
              <td className="px-4 py-2 text-right text-green-700">{formatCurrency(bill.amountPaid)}</td>
            </tr>
            {carried && (
              <tr className="bg-violet-50/50">
                <td className="px-4 py-2 text-violet-700">
                  Carried forward to {TERM_LABELS[bill.carriedForward.term]} {bill.carriedForward.academicSession}
                </td>
                <td className="px-4 py-2 text-right text-violet-700">−{formatCurrency(bill.carriedForward.amount)}</td>
              </tr>
            )}
            <tr className="font-bold">
              <td className="px-4 py-2">{bill.balance < 0 ? "Credit" : "Outstanding balance"}</td>
              <td className={`px-4 py-2 text-right ${bill.balance > 0 ? "text-red-600" : "text-gray-800"}`}>
                {bill.waived ? "Waived" : formatCurrency(Math.abs(bill.balance))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {bill.waived && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600 mb-4">
          Fees waived{bill.waiverReason ? `: ${bill.waiverReason}` : ""}.
        </div>
      )}

      {carried && (
        <div className="flex gap-2 bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800 mb-4">
          <ArrowRightLeft className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            The unpaid {formatCurrency(bill.carriedForward.amount)} was moved to the {TERM_LABELS[bill.carriedForward.term]}{" "}
            {bill.carriedForward.academicSession} bill on {formatDate(bill.carriedForward.at)}. Record payments and make
            changes on that bill.
          </span>
        </div>
      )}

      {lastReminder && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Bell className="w-3.5 h-3.5" />
          Last reminder {timeAgo(lastReminder.sentAt)} to {lastReminder.recipients.join(", ")}
          {bill.reminders.length > 1 && <span>· {bill.reminders.length} sent in total</span>}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {canManageFees && !carried && (
          <>
            <button
              className={secondaryButton}
              onClick={() => openPanel("discount", { amount: String(bill.discount?.amount || ""), reason: bill.discount?.reason || "" })}
            >
              <BadgePercent className="w-4 h-4" /> Discount
            </button>
            {bill.waived ? (
              <button className={secondaryButton} disabled={saving} onClick={() => patch({ action: "unwaive" }, "Waiver removed")}>
                <Undo2 className="w-4 h-4" /> Remove Waiver
              </button>
            ) : (
              <button className={secondaryButton} onClick={() => openPanel("waive", { reason: "" })}>
                <Ban className="w-4 h-4" /> Waive Fees
              </button>
            )}
          </>
        )}
        {canRecord && (
          <button
            className={secondaryButton}
            onClick={() => openPanel("notes", { notes: bill.notes || "", dueDate: toInputDate(bill.dueDate) })}
          >
            <Pencil className="w-4 h-4" /> Notes & Due Date
          </button>
        )}
      </div>

      {panel && (
        <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-4 mb-5 space-y-3">
          {panel === "discount" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Discount amount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    max={feesOnly(bill)}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-1">Max {formatCurrency(feesOnly(bill))} (this term&apos;s fees). Use 0 to remove.</p>
                </div>
                <div>
                  <label className={labelClass}>Reason</label>
                  <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} placeholder="e.g. Staff child" />
                </div>
              </div>
              <PanelButtons
                saving={saving}
                onCancel={() => setPanel(null)}
                onSave={() => patch({ action: "discount", amount: Number(form.amount) || 0, reason: form.reason }, "Discount saved")}
              />
            </>
          )}
          {panel === "waive" && (
            <>
              <label className={labelClass}>Reason for waiver</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} placeholder="e.g. Full scholarship" />
              <PanelButtons
                saving={saving}
                danger
                saveLabel="Waive Fees"
                disabled={!form.reason?.trim()}
                onCancel={() => setPanel(null)}
                onSave={() => patch({ action: "waive", reason: form.reason }, "Fees waived")}
              />
            </>
          )}
          {panel === "notes" && (
            <>
              <div>
                <label className={labelClass}>Due date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} placeholder="e.g. Parent promised to pay balance by mid-term" />
              </div>
              <PanelButtons
                saving={saving}
                onCancel={() => setPanel(null)}
                onSave={() => patch({ action: "update", notes: form.notes, dueDate: form.dueDate || null }, "Bill updated")}
              />
            </>
          )}
          {panel.startsWith("void:") && (
            <>
              <p className="text-sm text-gray-700">
                Voiding keeps the payment on record but removes it from the amount paid. Use this to correct mistakes.
              </p>
              <label className={labelClass}>Reason for voiding</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} placeholder="e.g. Recorded against wrong student" />
              <PanelButtons
                saving={saving}
                danger
                saveLabel="Void Payment"
                disabled={!form.reason?.trim()}
                onCancel={() => setPanel(null)}
                onSave={() => patch({ action: "void-payment", paymentId: panel.slice(5), reason: form.reason }, "Payment voided")}
              />
            </>
          )}
        </div>
      )}

      {bill.notes && panel !== "notes" && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800 mb-4 whitespace-pre-line">{bill.notes}</div>
      )}

      {/* Payments */}
      <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
        <ReceiptText className="w-4 h-4 text-blue-600" /> Payments ({bill.payments.filter((p) => !p.voided).length})
      </h3>
      {payments.length === 0 ? (
        <p className="text-sm text-gray-500 mb-5">No payments recorded yet.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg mb-5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Receipt</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Recorded by</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p._id} className={p.voided ? "bg-red-50/40 text-gray-400" : ""}>
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(p.paidAt)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={p.voided ? "line-through" : ""}>{p.receiptNo}</span>
                    {p.voided && <div className="text-xs text-red-500">Voided: {p.voidReason}</div>}
                    {p.reference && <div className="text-xs text-gray-400">Ref: {p.reference}</div>}
                    {p.receiptEmailedTo?.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-green-600" title={p.receiptEmailedTo.join(", ")}>
                        <Mail className="w-3 h-3" /> Receipt emailed
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{methodLabel(p.method)}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${p.voided ? "line-through" : "text-gray-800"}`}>{formatCurrency(p.amount)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{personName(p.recordedBy)}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button
                        title="Print receipt"
                        className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                        onClick={() =>
                          printReceipt({ schoolName, bill, payment: p, balanceAfter: balanceAfterPayment(bill, p) }) ||
                          toast.error("Allow pop-ups to print the receipt")
                        }
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {canManageFees && !p.voided && !carried && (
                        <button
                          title="Void payment"
                          className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => openPanel(`void:${p._id}`, { reason: "" })}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History across terms */}
      {history.length > 1 && (
        <>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-blue-600" /> Billing history
            <span className="ml-auto text-xs font-semibold text-red-600">Total outstanding: {formatCurrency(totalOutstanding)}</span>
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg mb-5">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Term</th>
                  <th className="px-3 py-2">Class</th>
                  <th className="px-3 py-2 text-right">Fees</th>
                  <th className="px-3 py-2 text-right">Paid</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((h) => (
                  <tr key={h._id} className={h._id === bill._id ? "bg-blue-50/50" : ""}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {TERM_LABELS[h.term]} {h.academicSession}
                    </td>
                    <td className="px-3 py-2">{h.class?.name || "—"}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(h.netAmount)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(h.amountPaid)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(Math.max(h.balance, 0))}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={h.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Audit trail */}
      {bill.activity?.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-gray-600 hover:text-gray-800">Activity log ({bill.activity.length})</summary>
          <ul className="mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
            {[...bill.activity].reverse().map((a, idx) => (
              <li key={idx}>
                <p className="text-gray-700">{a.description || a.action}</p>
                <p className="text-xs text-gray-400">
                  {personName(a.by)} · {new Date(a.at).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </ModalFrame>
  );
}

function PanelButtons({ saving, onCancel, onSave, danger = false, saveLabel = "Save", disabled = false }) {
  return (
    <div className="flex justify-end gap-2 pt-1">
      <button className={secondaryButton} onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      <button className={danger ? dangerButton : primaryButton} onClick={onSave} disabled={saving || disabled}>
        {saving && <Loader className="w-4 h-4 animate-spin" />}
        {saveLabel}
      </button>
    </div>
  );
}
