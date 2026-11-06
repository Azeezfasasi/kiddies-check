import User from "@/app/server/models/User";
import Class from "@/app/server/models/Class";
import School from "@/app/server/models/School";
import { sendFeedbackNotificationEmail } from "@/app/server/utils/emailService";
import { roleLabel } from "@/utils/roles";

interface FeedbackNotice {
  feedback: { _id: unknown; author: unknown; title: string; comment: string };
  student: { firstName?: string; lastName?: string; parent?: unknown; class?: unknown };
  schoolId: string;
  actor: { _id: unknown; firstName?: string; lastName?: string; role?: string };
  // Set for a reply; otherwise this is a new piece of feedback
  replyComment?: string;
}

/**
 * Emails the people following a student's feedback thread: the student's parent and
 * class teacher, plus (for replies) whoever wrote the original feedback. The person
 * who posted is never emailed. Failures are logged and never break the request.
 */
export async function notifyFeedbackParticipants({ feedback, student, schoolId, actor, replyComment }: FeedbackNotice) {
  try {
    const recipientIds = new Set<string>();
    if (student.parent) recipientIds.add(String(student.parent));
    if (student.class) {
      const schoolClass = await Class.findById(student.class).select("classTeacher");
      if (schoolClass?.classTeacher) recipientIds.add(String(schoolClass.classTeacher));
    }
    if (replyComment !== undefined && feedback.author) recipientIds.add(String(feedback.author));
    recipientIds.delete(String(actor._id));
    if (recipientIds.size === 0) return;

    const [recipients, school] = await Promise.all([
      User.find({ _id: { $in: [...recipientIds] }, isActive: true }).select("firstName lastName email"),
      School.findById(schoolId).select("name"),
    ]);

    const studentName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "your student";
    const authorName = `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || "Someone";

    const results = await Promise.allSettled(
      recipients
        .filter((r) => r.email)
        .map((r) =>
          sendFeedbackNotificationEmail({
            toEmail: r.email,
            toName: `${r.firstName || ""} ${r.lastName || ""}`.trim() || "there",
            studentName,
            schoolName: school?.name || "your school",
            authorName,
            authorRole: roleLabel(actor.role),
            title: feedback.title,
            comment: replyComment ?? feedback.comment,
            isReply: replyComment !== undefined,
          })
        )
    );
    results.forEach((result) => {
      if (result.status === "rejected") console.error("[Feedback email error]", result.reason);
    });
  } catch (error) {
    console.error("[Feedback notification error]", error);
  }
}
