import { withAudit } from "@/app/server/lib/audit";
import { type NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import User from '@/app/server/models/User';
import { authenticateRequest } from '@/app/server/lib/requireAccess';
import { canActOnSchool, canManageMembers } from '@/app/server/lib/schoolMembers';
import { isPlatformRole } from '@/utils/roles';

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

/**
 * POST /api/school/members/{id}/unlock
 * Lets a school leader (or learning specialist, or admin) lift a lockout from too many
 * failed logins for a member of their own school. Admin and platform accounts can only
 * be unlocked from Manage All Users.
 */
async function postHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('response' in auth) return auth.response;
    const { user } = auth;

    if (!canManageMembers(user.role)) return fail('You do not have permission to manage members', 403);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail('Invalid member ID', 400);

    const member = await SchoolMember.findById(id).select('school user status');
    if (!member || !member.user) return fail('Member not found', 404);
    if (!(await canActOnSchool(user, member.school))) return fail('You can only manage members of your own school', 403);

    const target = await User.findById(member.user);
    if (!target) return fail('This member has no account', 404);
    if (target.role === 'admin' || isPlatformRole(target.role)) {
      return fail('This account can only be unlocked by a platform administrator', 403);
    }

    const wasLocked = Boolean(target.isAccountLocked());
    await target.resetLoginAttempts();

    return NextResponse.json(
      {
        success: true,
        message: wasLocked
          ? `${target.firstName} ${target.lastName} can sign in again`
          : `${target.firstName} ${target.lastName} wasn't locked; failed attempts were reset`,
        wasLocked,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unlocking member:', error);
    return fail(error.message || 'Failed to unlock member', 500);
  }
}

export const POST = withAudit(postHandler);
