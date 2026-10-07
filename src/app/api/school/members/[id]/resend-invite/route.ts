import { withAudit } from "@/app/server/lib/audit";
import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import School from '@/app/server/models/School';
import type { UserDocument } from '@/app/server/models/User';
import { authenticateRequest } from '@/app/server/lib/requireAccess';
import { canActOnSchool, canManageMembers } from '@/app/server/lib/schoolMembers';
import { sendEmailViaBrevo, generateInvitationEmail, invitationLink } from '@/app/server/lib/invitationEmail';

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

/**
 * POST /api/school/members/{id}/resend-invite
 * Emails a pending invitation again. The link is the same as the original
 * email's, so whichever email the person opens still works.
 */
async function postHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('response' in auth) return auth.response;
    const { user } = auth;

    if (!canManageMembers(user.role)) return fail('You do not have permission to manage members', 403);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid member ID', 400);

    const member = await SchoolMember.findById(id)
      .select('+invitationToken')
      .populate<{ user: UserDocument | null }>('user', 'email firstName lastName');
    if (!member) return fail('Member not found', 404);
    if (!(await canActOnSchool(user, member.school))) return fail('You can only manage members of your own school', 403);
    if (member.status !== 'invited') return fail('This person has already accepted their invitation', 409);
    if (!member.user?.email) return fail('This invitation has no email address', 400);

    const school = await School.findById(member.school).select('name');
    if (!school) return fail('School not found', 404);

    // Invitations created before tokens were stored need one to build the link
    if (!member.invitationToken) {
      member.invitationToken = crypto.randomBytes(32).toString('hex');
      await member.save();
    }

    const email = member.user.email;
    const link = invitationLink('new-user', member.invitationToken, String(member.school), email);

    // Wait for the email service, so a failed send is reported rather than lost
    await sendEmailViaBrevo(
      email,
      `Reminder: you've been invited to join ${school.name} on Kiddies Check`,
      generateInvitationEmail(school.name, member.role, link, 'new-user')
    );

    return NextResponse.json({ success: true, message: `Invitation resent to ${email}` }, { status: 200 });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return fail(error.message || 'Failed to resend invitation', 500);
  }
}

export const POST = withAudit(postHandler);
