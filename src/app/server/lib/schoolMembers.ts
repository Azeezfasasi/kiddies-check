import SchoolMember from '@/app/server/models/SchoolMember';
import School from '@/app/server/models/School';
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

// When an account is deleted (soft delete), its active and pending memberships become
// inactive so they stop counting towards school member lists and access checks.
export async function deactivateMembershipsForDeletedUser(userId: unknown) {
  await SchoolMember.updateMany({ user: userId, status: { $in: ['active', 'invited'] } }, [
    { $set: { statusBeforeUserDeletion: '$status', status: 'inactive' } },
  ]);
}

// Restoring a deleted account puts back only the memberships its deletion deactivated.
// A membership whose school is still deleted stays inactive until the school is restored.
export async function restoreMembershipsForRestoredUser(userId: unknown) {
  const members = await SchoolMember.find({ user: userId, status: 'inactive', statusBeforeUserDeletion: { $in: ['active', 'invited'] } });
  for (const member of members) {
    const schoolActive = await School.exists({ _id: member.school, isActive: true });
    if (schoolActive) {
      member.status = member.statusBeforeUserDeletion;
    } else {
      member.statusBeforeSchoolDeletion = member.statusBeforeUserDeletion;
    }
    member.statusBeforeUserDeletion = undefined;
    await member.save();
  }
}

// A permanently deleted account's memberships can never come back.
export async function removeMembershipsForPermanentlyDeletedUser(userId: unknown) {
  await SchoolMember.updateMany(
    { user: userId },
    { $set: { status: 'removed' }, $unset: { statusBeforeUserDeletion: '', statusBeforeSchoolDeletion: '' } }
  );
}

// When a school is deleted or deactivated, its active and pending memberships become inactive.
export async function deactivateMembershipsForDeletedSchool(schoolId: unknown) {
  await SchoolMember.updateMany({ school: schoolId, status: { $in: ['active', 'invited'] } }, [
    { $set: { statusBeforeSchoolDeletion: '$status', status: 'inactive' } },
  ]);
}

// Restoring a school puts back only the memberships its deletion deactivated. A membership
// whose user account is still deleted stays inactive until the account is restored, and one
// whose account no longer exists is removed.
export async function restoreMembershipsForRestoredSchool(schoolId: unknown) {
  const members = await SchoolMember.find({ school: schoolId, status: 'inactive', statusBeforeSchoolDeletion: { $in: ['active', 'invited'] } });
  for (const member of members) {
    const user = await User.findById(member.user).select('accountStatus');
    if (!user) {
      member.status = 'removed';
    } else if (user.accountStatus === 'deleted') {
      member.statusBeforeUserDeletion = member.statusBeforeSchoolDeletion;
    } else {
      member.status = member.statusBeforeSchoolDeletion;
    }
    member.statusBeforeSchoolDeletion = undefined;
    await member.save();
  }
}

// A permanently deleted school's memberships can never come back.
export async function removeMembershipsForPermanentlyDeletedSchool(schoolId: unknown) {
  await SchoolMember.updateMany(
    { school: schoolId },
    { $set: { status: 'removed' }, $unset: { statusBeforeUserDeletion: '', statusBeforeSchoolDeletion: '' } }
  );
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
