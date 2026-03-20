import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import { connectDB } from '@/app/server/db/connect';

/**
 * GET /api/school/invitation/details?invitationToken=XXX&schoolId=YYY
 * Get invitation details including the invited email
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const invitationToken = searchParams.get('invitationToken');
    const schoolId = searchParams.get('schoolId');

    if (!invitationToken || !schoolId) {
      return NextResponse.json(
        { success: false, error: 'Invitation token and school ID are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    // Find the school member record by invitation token
    const schoolMember = await SchoolMember.findOne({
      invitationToken,
      school: schoolId,
    }).populate('user', 'email firstName lastName');

    if (!schoolMember) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Get email from the user record
    const email = schoolMember.user?.email;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email not found for this invitation' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          email,
          firstName: schoolMember.user?.firstName,
          lastName: schoolMember.user?.lastName,
          role: schoolMember.role,
          status: schoolMember.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invitation details:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch invitation details',
      },
      { status: 500 }
    );
  }
}
