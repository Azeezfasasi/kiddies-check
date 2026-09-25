import { can } from "@/utils/roles";

export const FEE_MANAGER_ROLES = ["admin", "school-leader"];
export const BILLING_ROLES = ["admin", "school-leader", "learning-specialist"];

// Mirrors the server: platform roles get view / edit (record) / manage via roles.js.
export const canViewBilling = (role) => BILLING_ROLES.includes(role) || can(role, "billing", "view");
export const canRecordPayments = (role) => BILLING_ROLES.includes(role) || can(role, "billing", "edit");

export const TERM_LABELS = { first: "First Term", second: "Second Term", third: "Third Term" };
export const TERMS = Object.keys(TERM_LABELS);

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "pos", label: "POS" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online" },
  { value: "other", label: "Other" },
];
export const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value;

export const FEE_ITEM_PRESETS = [
  "Tuition",
  "Development Levy",
  "Books & Materials",
  "Uniform",
  "PTA Levy",
  "Examination Fee",
  "ICT / Computer",
  "Sports",
  "Lesson / Extra Classes",
  "Feeding",
  "Transport",
];

export const STATUS_META = {
  paid: { label: "Paid", className: "bg-green-100 text-green-700 border-green-200" },
  partial: { label: "Part Paid", className: "bg-amber-100 text-amber-700 border-amber-200" },
  unpaid: { label: "Unpaid", className: "bg-red-100 text-red-700 border-red-200" },
  overpaid: { label: "In Credit", className: "bg-sky-100 text-sky-700 border-sky-200" },
  waived: { label: "Waived", className: "bg-gray-100 text-gray-600 border-gray-200" },
  "carried-forward": { label: "Carried Forward", className: "bg-violet-100 text-violet-700 border-violet-200" },
  overdue: { label: "Overdue", className: "bg-red-600 text-white border-red-600" },
};

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

export const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const studentName = (student) =>
  student ? `${student.firstName || ""} ${student.lastName || ""}`.trim() : "Unknown student";

export const isCarriedForward = (bill) => (bill?.carriedForward?.amount || 0) > 0;

// Bills saved before arrears existed have no feesAmount stored.
export const feesOnly = (bill) => bill.feesAmount ?? bill.grossAmount - (bill.arrearsAmount || 0);

export const timeAgo = (value) => {
  if (!value) return "";
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(value);
};

export const isOverdue = (bill) =>
  !!bill.dueDate && bill.balance > 0 && !bill.waived && new Date(bill.dueDate) < new Date(new Date().toDateString());

// Outstanding balance immediately after a payment, for (re)printing receipts.
export function balanceAfterPayment(bill, payment) {
  const at = (p) => [new Date(p.paidAt).getTime(), new Date(p.recordedAt || 0).getTime()];
  const [paidAt, recordedAt] = at(payment);
  const paid = bill.payments
    .filter((p) => {
      if (p.voided) return false;
      const [pa, ra] = at(p);
      return pa < paidAt || (pa === paidAt && ra <= recordedAt);
    })
    .reduce((sum, p) => sum + p.amount, 0);
  return bill.netAmount - paid;
}

export const canManageFees = (role) => FEE_MANAGER_ROLES.includes(role) || can(role, "billing", "manage");

export async function billingRequest(token, url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { success: false, message: "Unexpected server response" };
  }
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

const csvCell = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  // Prefix cells that spreadsheet apps would treat as formulas.
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * Opens a printable payment receipt in a new window.
 * bill needs: student, class, academicSession, term, netAmount; balanceAfter
 * is the outstanding balance to show on the receipt.
 */
export function printReceipt({ schoolName, bill, payment, balanceAfter }) {
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) return false;

  const rows = [
    ["Receipt No.", payment.receiptNo],
    ["Date", formatDate(payment.paidAt)],
    ["Student", studentName(bill.student)],
    ["Admission No.", bill.student?.enrollmentNo || "—"],
    ["Class", bill.class?.name || "—"],
    ["Session / Term", `${bill.academicSession} — ${TERM_LABELS[bill.term] || bill.term}`],
    ["Payment Method", methodLabel(payment.method)],
    ["Reference", payment.reference || "—"],
  ];

  win.document.write(`<!doctype html><html><head><title>Receipt ${escapeHtml(payment.receiptNo)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#111827;margin:0;padding:32px;background:#fff}
  .receipt{max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;padding:32px}
  h1{margin:0;font-size:22px;color:#1e3a8a} .sub{color:#6b7280;font-size:13px;margin-top:4px}
  .tag{display:inline-block;margin-top:16px;padding:4px 12px;border-radius:999px;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:bold;letter-spacing:.05em}
  table{width:100%;border-collapse:collapse;margin-top:24px;font-size:14px}
  td{padding:8px 0;border-bottom:1px solid #f3f4f6} td:first-child{color:#6b7280;width:40%}
  .amount{margin-top:24px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;display:flex;justify-content:space-between;align-items:center}
  .amount strong{font-size:24px;color:#15803d}
  .totals{margin-top:12px;font-size:14px} .totals div{display:flex;justify-content:space-between;padding:4px 0}
  .void{margin-top:16px;padding:10px;border:2px solid #dc2626;color:#dc2626;text-align:center;font-weight:bold}
  .foot{margin-top:32px;font-size:12px;color:#9ca3af;text-align:center}
  @media print{body{padding:0}.receipt{border:none}}
</style></head><body>
<div class="receipt">
  <h1>${escapeHtml(schoolName || "School")}</h1>
  <div class="sub">Official school fees payment receipt</div>
  <span class="tag">PAYMENT RECEIPT</span>
  ${payment.voided ? `<div class="void">VOIDED — ${escapeHtml(payment.voidReason || "")}</div>` : ""}
  <table>${rows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("")}</table>
  <div class="amount"><span>Amount Paid</span><strong>${escapeHtml(formatCurrency(payment.amount))}</strong></div>
  <div class="totals">
    ${bill.arrearsAmount > 0 ? `<div><span>Balance brought forward</span><span>${escapeHtml(formatCurrency(bill.arrearsAmount))}</span></div>` : ""}
    <div><span>Total due for term</span><span>${escapeHtml(formatCurrency(bill.netAmount))}</span></div>
    ${balanceAfter !== undefined ? `<div><span>Outstanding balance</span><span>${escapeHtml(formatCurrency(Math.max(balanceAfter, 0)))}</span></div>` : ""}
  </div>
  ${payment.note ? `<p style="font-size:13px;color:#4b5563;margin-top:16px">Note: ${escapeHtml(payment.note)}</p>` : ""}
  <div class="foot">Generated on ${escapeHtml(new Date().toLocaleString("en-GB"))}. Thank you for your payment.</div>
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
  return true;
}
