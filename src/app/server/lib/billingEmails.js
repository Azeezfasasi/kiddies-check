import Student from "@/app/server/models/Student";
import School from "@/app/server/models/School";
import StudentBill from "@/app/server/models/StudentBill";
import { sendEmailViaBrevo } from "@/app/server/utils/brevoEmailService";
import { feeReminderEmail, paymentReceiptEmail } from "@/app/server/templates/billingEmailTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CONCURRENCY = 4;
export const REMINDER_COOLDOWN_HOURS = 12;

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

// Parent portal account first, then the guardian email on the student record.
export function feeRecipients(student) {
  const recipients = [];
  const add = (email, name, hasPortal) => {
    const clean = (email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || recipients.some((r) => r.email === clean)) return;
    recipients.push({ email: clean, name: (name || "").trim(), hasPortal });
  };
  if (student?.parent && typeof student.parent === "object") {
    add(student.parent.email, `${student.parent.firstName || ""} ${student.parent.lastName || ""}`, true);
  }
  add(student?.guardian?.email, student?.guardian?.name, false);
  return recipients;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
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

async function loadContext(bills) {
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

function prepare(bill, context) {
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
      className: student?.class?.name,
      portalUrl: APP_URL && recipients.some((r) => r.hasPortal) ? `${APP_URL}/dashboard/my-children` : null,
    },
  };
}

async function send(recipients, school, content, tag) {
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
export async function sendReceiptEmails(entries) {
  if (entries.length === 0) return [];
  const context = await loadContext(entries.map((e) => e.bill));

  return mapLimit(entries, EMAIL_CONCURRENCY, async ({ bill, payment }) => {
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
export async function sendReminderEmails(bills, { message, userId }) {
  const summary = { sent: 0, notOwing: 0, recent: 0, noEmail: 0, failed: 0 };
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
