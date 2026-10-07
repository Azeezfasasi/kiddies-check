import SchoolMember from '@/app/server/models/SchoolMember';
import type { UserDocument } from '@/app/server/models/User';
import { can, hasAllSchoolAccess } from '@/utils/roles';

// Full member management (role, status, permissions, removal, resending invites).
export const canManageMembers = (role: string) =>
  ['admin', 'school-leader', 'learning-specialist'].includes(role) || can(role, 'school-manager', 'edit');

// View-only School Manager access (e.g. Viewer): may only edit the permissions
// of their own membership, never anyone's role or status.
export const isViewOnlyMemberAccess = (role: string) => !canManageMembers(role) && can(role, 'school-manager', 'view');

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
