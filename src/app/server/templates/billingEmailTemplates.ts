// HTML emails for school-fee receipts and payment reminders. Every value is
// escaped because names, notes and references come from user input.

/** Bill fields the emails read (a hydrated or lean StudentBill). */
export interface EmailBill {
  term: string;
  academicSession: string;
  netAmount?: number | null;
  amountPaid?: number | null;
  balance?: number | null;
  dueDate?: Date | null;
  items?: { name: string; amount: number }[] | null;
  arrears?: { term: string; academicSession: string; amount: number }[] | null;
  discount?: { amount?: number | null } | null;
}

export interface EmailPayment {
  amount: number;
  receiptNo: string;
  paidAt: Date;
  method: string;
  reference?: string | null;
}

interface EmailCommon {
  schoolName: string;
  guardianName?: string;
  studentName: string;
  className?: string;
  portalUrl?: string | null;
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const naira = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 });
export const formatNaira = (value: unknown): string => naira.format(Number(value) || 0);

const formatDate = (value: Date | string | null | undefined): string =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  "bank-transfer": "Bank Transfer",
  pos: "POS",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

const TERM_LABELS: Record<string, string> = { first: "First Term", second: "Second Term", third: "Third Term" };
export const billTermLabel = (bill: Pick<EmailBill, "term" | "academicSession">): string => `${TERM_LABELS[bill.term] || bill.term} ${bill.academicSession}`;

const row = (label: string, value: unknown, strong = false): string => `
  <tr>
    <td style="padding:8px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;width:45%">${escapeHtml(label)}</td>
    <td style="padding:8px 0;color:#111827;font-size:14px;border-bottom:1px solid #f3f4f6;${strong ? "font-weight:bold" : ""}">${escapeHtml(value)}</td>
  </tr>`;

const layout = ({
  schoolName,
  heading,
  accent,
  body,
  portalUrl,
}: {
  schoolName: string;
  heading: string;
  accent: string;
  body: string;
  portalUrl?: string | null;
}): string => `<!doctype html>
<html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:${accent};padding:24px 28px;color:#ffffff">
          <div style="font-size:13px;opacity:.85">${escapeHtml(schoolName)}</div>
          <div style="font-size:22px;font-weight:bold;margin-top:4px">${escapeHtml(heading)}</div>
        </td></tr>
        <tr><td style="padding:28px">
          ${body}
          ${
            portalUrl
              ? `<p style="margin:28px 0 0"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px">View fees in the parent portal</a></p>`
              : ""
          }
          <p style="margin:28px 0 0;font-size:12px;color:#9ca3af">
            This is an automated message from ${escapeHtml(schoolName)} via KiddiesCheck. If you have questions about your
            child's fees, reply to this email or contact the school bursary.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

export function paymentReceiptEmail({
  schoolName,
  guardianName,
  studentName,
  className,
  bill,
  payment,
  portalUrl,
}: EmailCommon & { bill: EmailBill; payment: EmailPayment }): EmailContent {
  const balance = Math.max(bill.balance, 0);
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#111827">Dear ${escapeHtml(guardianName || "Parent/Guardian")},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.5">
      We have received a school fees payment for <strong>${escapeHtml(studentName)}</strong>. Thank you.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:13px;color:#166534">Amount received</div>
      <div style="font-size:28px;font-weight:bold;color:#15803d">${escapeHtml(formatNaira(payment.amount))}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Receipt No.", payment.receiptNo, true)}
      ${row("Payment date", formatDate(payment.paidAt))}
      ${row("Payment method", METHOD_LABELS[payment.method] || payment.method)}
      ${payment.reference ? row("Reference", payment.reference) : ""}
      ${row("Student", studentName)}
      ${row("Class", className || "—")}
      ${row("Term", billTermLabel(bill))}
      ${row("Total due for term", formatNaira(bill.netAmount))}
      ${row("Total paid to date", formatNaira(bill.amountPaid))}
      ${row("Outstanding balance", balance > 0 ? formatNaira(balance) : "Fully paid", true)}
    </table>`;
  return {
    subject: `Payment receipt ${payment.receiptNo} — ${studentName}`,
    html: layout({ schoolName, heading: "School Fees Payment Receipt", accent: "#15803d", body, portalUrl }),
    text: `Payment of ${formatNaira(payment.amount)} received for ${studentName} (${billTermLabel(bill)}). Receipt ${payment.receiptNo}. Outstanding balance: ${formatNaira(balance)}.`,
  };
}

export function feeReminderEmail({
  schoolName,
  guardianName,
  studentName,
  className,
  bill,
  message,
  portalUrl,
}: EmailCommon & { bill: EmailBill; message?: string }): EmailContent {
  const overdue = bill.dueDate && new Date(bill.dueDate) < new Date();
  const lines: [string, number][] = [
    ...(bill.arrears || []).map((a): [string, number] => [
      `Balance brought forward (${TERM_LABELS[a.term] || a.term} ${a.academicSession})`,
      a.amount,
    ]),
    ...(bill.items || []).map((i): [string, number] => [i.name, i.amount]),
    ...(bill.discount?.amount > 0 ? [["Discount", -bill.discount.amount] as [string, number]] : []),
  ];
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#111827">Dear ${escapeHtml(guardianName || "Parent/Guardian")},</p>
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.5">
      This is a friendly reminder that <strong>${escapeHtml(studentName)}</strong> has an outstanding school fees balance
      for ${escapeHtml(billTermLabel(bill))}${bill.dueDate ? `, ${overdue ? "which was due on" : "due by"} <strong>${escapeHtml(formatDate(bill.dueDate))}</strong>` : ""}.
    </p>
    ${message ? `<div style="background:#eff6ff;border-left:4px solid #1e40af;padding:12px 16px;margin-bottom:20px;font-size:14px;color:#1e3a8a;white-space:pre-line">${escapeHtml(message)}</div>` : ""}
    <div style="background:${overdue ? "#fef2f2" : "#fffbeb"};border:1px solid ${overdue ? "#fecaca" : "#fde68a"};border-radius:10px;padding:16px 20px;margin-bottom:20px">
      <div style="font-size:13px;color:${overdue ? "#991b1b" : "#92400e"}">Outstanding balance${overdue ? " (overdue)" : ""}</div>
      <div style="font-size:28px;font-weight:bold;color:${overdue ? "#b91c1c" : "#b45309"}">${escapeHtml(formatNaira(bill.balance))}</div>
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Student", studentName)}
      ${row("Class", className || "—")}
      ${lines.map(([label, amount]) => row(label, formatNaira(amount))).join("")}
      ${row("Total due", formatNaira(bill.netAmount), true)}
      ${row("Paid so far", formatNaira(bill.amountPaid))}
      ${row("Balance", formatNaira(bill.balance), true)}
    </table>
    <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.5">
      If you have already made this payment, please disregard this reminder or share your payment evidence with the school.
    </p>`;
  return {
    subject: `School fees reminder — ${studentName} (${billTermLabel(bill)})`,
    html: layout({ schoolName, heading: "School Fees Reminder", accent: overdue ? "#b91c1c" : "#1e40af", body, portalUrl }),
    text: `Reminder: ${studentName} has an outstanding school fees balance of ${formatNaira(bill.balance)} for ${billTermLabel(bill)}.`,
  };
}
