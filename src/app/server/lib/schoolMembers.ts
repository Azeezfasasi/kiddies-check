import SchoolMember from '@/app/server/models/SchoolMember';
import User, { type UserDocument } from '@/app/server/models/User';
import { can, hasAllSchoolAccess } from '@/utils/roles';

// Full member management (role, status, permissions, removal, resending invites).
export const canManageMembers = (role: string) =>
  ['admin', 'school-leader', 'learning-specialist'].includes(role) || can(role, 'school-manager', 'edit');

// View-only School Manager access (e.g. Viewer): may only edit the permissions
// of their own membership, never anyone's role or status.
export const isViewOnlyMemberAccess = (role: string) => !canManageMembers(role) && can(role, 'school-manager', 'view');

// School membership roles that are also account roles. Access checks read the account
// role (User.role), so a membership role change has to reach the account too.
const SCHOOL_ACCOUNT_ROLES = ['school-leader', 'learning-specialist', 'teacher', 'parent'];

export type RoleSyncResult = { updated: boolean; note?: string };

/**
 * Makes the user's account role match their membership role at `schoolId`.
 * Only switches between school roles: admins and platform roles are never changed,
 * and 'staff' has no account role. Users active at another school are skipped,
 * because one account role applies to every school they belong to.
 */
export async function syncAccountRoleWithMembership(userId: unknown, memberRole: string, schoolId: unknown): Promise<RoleSyncResult> {
  if (!SCHOOL_ACCOUNT_ROLES.includes(memberRole)) return { updated: false };

  const user = await User.findById(userId).select('role schoolId');
  if (!user || !SCHOOL_ACCOUNT_ROLES.includes(user.role)) return { updated: false };
  if (user.role === memberRole) {
    if (!user.schoolId) await User.updateOne({ _id: user._id }, { schoolId });
    return { updated: false };
  }

  const otherSchool = await SchoolMember.exists({ user: user._id, school: { $ne: schoolId }, status: 'active' });
  if (otherSchool) {
    return {
      updated: false,
      note: 'This person is also active at another school, so their account role was not changed. Update it from Manage All Users if needed.',
    };
  }

  await User.updateOne({ _id: user._id }, { role: memberRole, ...(user.schoolId ? {} : { schoolId }) });
  return { updated: true };
}

// Admins and cross-school roles act on any school; school leaders only on
// their own school (primary school or an active leadership membership).
export async function canActOnSchool(user: UserDocument, schoolId: unknown): Promise<boolean> {
  if (user.role === 'admin' || hasAllSchoolAccess(user.role)) return true;
  if (user.schoolId && user.schoolId.toString() === String(schoolId)) return true;
  const membership = await SchoolMember.findOne({
    user: user._id,
    school: schoolId,
    role: 'school-leader',
    status: 'active',
  }).select('_id');
  return !!membership;
}
