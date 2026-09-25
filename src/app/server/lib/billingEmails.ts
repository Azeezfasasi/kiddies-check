import Student from "@/app/server/models/Student";
import School from "@/app/server/models/School";
import type { Types } from "mongoose";
import StudentBill, { type StudentBillFields } from "@/app/server/models/StudentBill";
import { sendEmailViaBrevo } from "@/app/server/utils/brevoEmailService";
import {
  feeReminderEmail,
  paymentReceiptEmail,
  type EmailContent,
} from "@/app/server/templates/billingEmailTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CONCURRENCY = 4;
export const REMINDER_COOLDOWN_HOURS = 12;

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

export interface FeeRecipient {
  email: string;
  name: string;
  /** True when the address belongs to a parent portal account. */
  hasPortal: boolean;
}

/** The student fields recipients are read from; `parent` may be populated. */
interface StudentContact {
  firstName?: string;
  lastName?: string;
  parent?: unknown;
  guardian?: { name?: string | null; email?: string | null } | null;
  class?: unknown;
}

interface PopulatedParent {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** A bill as passed in by the routes (hydrated or lean). */
export type BillForEmail = StudentBillFields & { _id: Types.ObjectId };

export interface PaymentForEmail {
  _id: Types.ObjectId;
  amount: number;
  receiptNo: string;
  paidAt: Date;
  method: string;
  reference?: string | null;
}

export interface ReceiptEmailResult {
  billId: Types.ObjectId;
  emailedTo: string[];
  error?: string;
}

export interface ReminderSummary {
  sent: number;
  notOwing: number;
  recent: number;
  noEmail: number;
  failed: number;
}

// Parent portal account first, then the guardian email on the student record.
export function feeRecipients(student: StudentContact | null | undefined): FeeRecipient[] {
  const recipients: FeeRecipient[] = [];
  const add = (email: string | null | undefined, name: string | null | undefined, hasPortal: boolean) => {
    const clean = (email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || recipients.some((r) => r.email === clean)) return;
    recipients.push({ email: clean, name: (name || "").trim(), hasPortal });
  };
  if (student?.parent && typeof student.parent === "object") {
    const parent = student.parent as PopulatedParent;
    add(parent.email, `${parent.firstName || ""} ${parent.lastName || ""}`, true);
  }
  add(student?.guardian?.email, student?.guardian?.name, false);
  return recipients;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

async function loadContext(bills: BillForEmail[]) {
  const [students, schools] = await Promise.all([
    Student.find({ _id: { $in: bills.map((b) => b.student?._id || b.student) } })
      .select("firstName lastName guardian parent class")
      .populate("parent", "firstName lastName email")
      .populate("class", "name")
      .lean(),
    School.find({ _id: { $in: [...new Set(bills.map((b) => String(b.school)))] } })
      .select("name email")
      .lean(),
  ]);
  return {
    students: new Map(students.map((s) => [String(s._id), s])),
    schools: new Map(schools.map((s) => [String(s._id), s])),
  };
}

type EmailContext = Awaited<ReturnType<typeof loadContext>>;

function prepare(bill: BillForEmail, context: EmailContext) {
  const student = context.students.get(String(bill.student?._id || bill.student));
  const school = context.schools.get(String(bill.school));
  const recipients = feeRecipients(student);
  return {
    student,
    school,
    recipients,
    common: {
      schoolName: school?.name || "Your school",
      guardianName: recipients[0]?.name,
      studentName: student ? `${student.firstName} ${student.lastName}` : "your child",
      className: (student?.class as { name?: string } | undefined)?.name,
      portalUrl: APP_URL && recipients.some((r) => r.hasPortal) ? `${APP_URL}/dashboard/my-children` : null,
    },
  };
}

async function send(
  recipients: FeeRecipient[],
  school: { email?: string | null } | undefined,
  content: EmailContent,
  tag: string
): Promise<void> {
  await sendEmailViaBrevo({
    to: recipients.map((r) => r.email),
    subject: content.subject,
    htmlContent: content.html,
    textContent: content.text,
    replyTo: school?.email || null,
    tags: ["billing", tag],
  });
}

/**
 * Emails a receipt for each { bill, payment } pair and records who it went
 * to on the payment. Never throws — failures are reported per entry so a
 * payment is never rolled back because an email couldn't be sent.
 */
export async function sendReceiptEmails(
  entries: { bill: BillForEmail; payment: PaymentForEmail }[]
): Promise<ReceiptEmailResult[]> {
  if (entries.length === 0) return [];
  const context = await loadContext(entries.map((e) => e.bill));

  return mapLimit(entries, EMAIL_CONCURRENCY, async ({ bill, payment }): Promise<ReceiptEmailResult> => {
    const { recipients, school, common } = prepare(bill, context);
    if (recipients.length === 0) return { billId: bill._id, emailedTo: [], error: "No parent or guardian email on record" };
    try {
      await send(recipients, school, paymentReceiptEmail({ ...common, bill, payment }), "receipt");
      const emailedTo = recipients.map((r) => r.email);
      await StudentBill.updateOne(
        { _id: bill._id, "payments._id": payment._id },
        { $set: { "payments.$.receiptEmailedTo": emailedTo } }
      );
      return { billId: bill._id, emailedTo };
    } catch (error) {
      console.error("[Billing] Receipt email failed:", error.message);
      return { billId: bill._id, emailedTo: [], error: "Email could not be sent" };
    }
  });
}

/**
 * Sends balance reminders for the given bills. Bills that aren't owing, were
 * reminded within the cooldown, or have no email on record are skipped.
 */
export async function sendReminderEmails(
  bills: BillForEmail[],
  { message, userId }: { message: string; userId: Types.ObjectId }
): Promise<ReminderSummary> {
  const summary: ReminderSummary = { sent: 0, notOwing: 0, recent: 0, noEmail: 0, failed: 0 };
  const cutoff = Date.now() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000;

  const eligible = bills.filter((bill) => {
    if (bill.waived || bill.balance <= 0) {
      summary.notOwing++;
      return false;
    }
    if (bill.lastReminderAt && new Date(bill.lastReminderAt).getTime() > cutoff) {
      summary.recent++;
      return false;
    }
    return true;
  });
  if (eligible.length === 0) return summary;

  const context = await loadContext(eligible);
  await mapLimit(eligible, EMAIL_CONCURRENCY, async (bill) => {
    const { recipients, school, common } = prepare(bill, context);
    if (recipients.length === 0) {
      summary.noEmail++;
      return;
    }
    try {
      await send(recipients, school, feeReminderEmail({ ...common, bill, message }), "reminder");
      const sentAt = new Date();
      await StudentBill.updateOne(
        { _id: bill._id },
        {
          $set: { lastReminderAt: sentAt },
          $push: {
            reminders: { sentAt, sentBy: userId, recipients: recipients.map((r) => r.email), balance: bill.balance },
            activity: {
              action: "reminder-sent",
              description: `Payment reminder emailed to ${recipients.map((r) => r.email).join(", ")}`,
              by: userId,
              at: sentAt,
            },
          },
        }
      );
      summary.sent++;
    } catch (error) {
      console.error("[Billing] Reminder email failed:", error.message);
      summary.failed++;
    }
  });
  return summary;
}
