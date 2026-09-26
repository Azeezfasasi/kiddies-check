import { type NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import type { UserDocument } from '@/app/server/models/User';
import { authenticateRequest } from '@/app/server/lib/requireAccess';
import { can, hasAllSchoolAccess } from '@/utils/roles';

const VALID_ROLES = ['school-leader', 'learning-specialist', 'teacher', 'parent', 'staff'];
const VALID_STATUSES = ['invited', 'active', 'inactive', 'removed'];
const VALID_PERMISSIONS = ['view_students', 'edit_students', 'view_reports', 'manage_members', 'edit_school_info', 'view_analytics'];

// Full member management (role, status, permissions, removal).
const canManageMembers = (role: string) =>
  ['admin', 'school-leader', 'learning-specialist'].includes(role) || can(role, 'school-manager', 'edit');

// View-only School Manager access (e.g. Viewer): may only edit the permissions
// of their own membership, never anyone's role or status.
const isViewOnlyMemberAccess = (role: string) => !canManageMembers(role) && can(role, 'school-manager', 'view');

// Admins and cross-school roles act on any school; school leaders only on
// their own school (primary school or an active leadership membership).
async function canActOnSchool(user: UserDocument, schoolId: unknown): Promise<boolean> {
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

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

/**
 * PUT /api/school/members/{id}
 * Update school member (role, permissions, status)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('response' in auth) return auth.response;
    const { user } = auth;

    const { id } = await params;
    const { role, permissions, status } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail('Invalid member ID', 400);
    }

    const viewOnly = isViewOnlyMemberAccess(user.role);
    if (!canManageMembers(user.role) && !viewOnly) {
      return fail('You do not have permission to update school members', 403);
    }

    const existing = await SchoolMember.findById(id).select('school user');
    if (!existing) {
      return fail('Member not found', 404);
    }
    if (!(await canActOnSchool(user, existing.school))) {
      return fail('You do not have access to this school', 403);
    }

    if (viewOnly) {
      if (role || status) {
        return fail("Your role cannot change a member's role or status", 403);
      }
      if (existing.user?.toString() !== user._id.toString()) {
        return fail('Your role can only update your own permissions', 403);
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return fail('Invalid role', 400);
      }
      updateData.role = role;
    }

    if (permissions) {
      if (!Array.isArray(permissions) || permissions.some((p) => !VALID_PERMISSIONS.includes(p))) {
        return fail('Invalid permissions', 400);
      }
      updateData.permissions = permissions;
    }

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return fail('Invalid status', 400);
      }
      updateData.status = status;
    }

    const member = await SchoolMember.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate('user', 'firstName lastName email avatar');

    if (!member) {
      return fail('Member not found', 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Member updated successfully',
        data: member,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating member:', error);
    return fail(error.message || 'Failed to update member', 500);
  }
}

/**
 * DELETE /api/school/members/{id}
 * Remove member from school
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('response' in auth) return auth.response;
    const { user } = auth;

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail('Invalid member ID', 400);
    }

    if (!canManageMembers(user.role)) {
      return fail('You do not have permission to remove school members', 403);
    }

    const existing = await SchoolMember.findById(id).select('school');
    if (!existing) {
      return fail('Member not found', 404);
    }
    if (!(await canActOnSchool(user, existing.school))) {
      return fail('You do not have access to this school', 403);
    }

    await SchoolMember.findByIdAndDelete(id);

    return NextResponse.json(
      {
        success: true,
        message: 'Member removed from school',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing member:', error);
    return fail(error.message || 'Failed to remove member', 500);
  }
}
