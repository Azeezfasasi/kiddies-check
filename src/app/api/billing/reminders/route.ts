import type { NextRequest } from "next/server";
/**
 * /api/billing/reminders
 * Email outstanding-balance reminders to parents/guardians.
 */

import StudentBill from "@/app/server/models/StudentBill";
import { REMINDER_COOLDOWN_HOURS, sendReminderEmails } from "@/app/server/lib/billingEmails";
import { authorizeSchool, isValidId, jsonError } from "@/app/server/lib/billing";

const MAX_REMINDERS = 500;

/**
 * POST /api/billing/reminders
 * { schoolId, billIds: [], message? }
 * Bills that are paid/waived, were reminded in the last 12 hours, or have no
 * parent/guardian email are skipped and counted in the response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await authorizeSchool(request, body.schoolId, { requireRecorder: true });
    if (auth.error) return jsonError(auth.error, auth.status);

    const billIds = [...new Set((body.billIds || []).filter(isValidId))];
    if (billIds.length === 0) return jsonError("Select at least one student", 400);
    if (billIds.length > MAX_REMINDERS) return jsonError(`You can remind at most ${MAX_REMINDERS} students at once`, 400);

    const message = (body.message || "").toString().trim().slice(0, 1000);
    const bills = await StudentBill.find({ _id: { $in: billIds }, school: body.schoolId })
      .select("-activity -payments")
      .lean();

    const summary = await sendReminderEmails(bills, { message, userId: auth.user._id });

    const parts = [`${summary.sent} reminder(s) sent`];
    if (summary.noEmail) parts.push(`${summary.noEmail} without a parent email`);
    if (summary.recent) parts.push(`${summary.recent} already reminded in the last ${REMINDER_COOLDOWN_HOURS} hours`);
    if (summary.notOwing) parts.push(`${summary.notOwing} not owing`);
    if (summary.failed) parts.push(`${summary.failed} failed to send`);

    return Response.json({
      success: true,
      message: parts.join(", ") + ".",
      ...summary,
    });
  } catch (error) {
    console.error("Error sending fee reminders:", error);
    return jsonError("Failed to send reminders", 500);
  }
}
