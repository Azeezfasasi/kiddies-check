import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';

/**
 * PUT /api/school/members/{id}
 * Update school member (role, permissions, status)
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { role, permissions, status } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    const validRoles = ['school-leader', 'teacher', 'parent', 'staff'];
    const validStatuses = ['invited', 'active', 'inactive', 'removed'];

    // Build update object
    const updateData = {};
    if (role) {
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role' },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (permissions) {
      updateData.permissions = permissions;
    }

    if (status) {
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const member = await SchoolMember.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate('user', 'firstName lastName email avatar');

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
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
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update member',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/school/members/{id}
 * Remove member from school
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    const member = await SchoolMember.findByIdAndDelete(id);

    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Member removed from school',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove member',
      },
      { status: 500 }
    );
  }
}
