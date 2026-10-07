import { withAudit } from "@/app/server/lib/audit";
import { verifiedUserId } from "@/app/server/lib/requireAccess";
import { type NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import School from '@/app/server/models/School';
import User from '@/app/server/models/User';
import crypto from 'crypto';
import { connectDB } from '@/app/server/db/connect';
import { sendEmailViaBrevo, generateInvitationEmail, invitationLink as buildInvitationLink } from '@/app/server/lib/invitationEmail';

/**
 * POST /api/school/invite-member
 * Invite a member to join the school
 */
async function postHandler(request: NextRequest) {
  try {
    await connectDB();

    const { schoolId, email, role, permissions, firstName, lastName } = await request.json();

    // Validate input
    if (!schoolId || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'School ID, email, and role are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['school-leader', 'learning-specialist', 'teacher', 'parent', 'staff'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Check if user exists
    let user = await User.findByEmail(email);

    let invitationType = 'existing-user'; // User already exists
    let invitationToken = null;

    if (!user) {
      // Create a pending user account
      invitationType = 'new-user';

      // Generate an invitation token for new users
      invitationToken = crypto.randomBytes(32).toString('hex');

      // Use provided names or generate from email
      const nameParts = email.split('@')[0].split('.');
      const userFirstName = firstName || nameParts[0] || 'User';
      const userLastName = lastName || nameParts[1] || 'Account';

      user = new User({
        email: email.toLowerCase(),
        firstName: userFirstName,
        lastName: userLastName,
        password: 'temp-' + crypto.randomBytes(16).toString('hex'), // Temporary password
        isEmailVerified: false,
        isActive: false,
      });

      await user.save();
    }

    // Check if user is already a member of this school
    const existingMembership = await SchoolMember.findOne({
      school: schoolId,
      user: user._id,
    });

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: 'User is already a member of this school',
        },
        { status: 409 }
      );
    }

    // Create school membership
    const schoolMember = new SchoolMember({
      school: schoolId,
      user: user._id,
      role,
      status: invitationType === 'new-user' ? 'invited' : 'active',
      permissions: permissions || [],
      invitationToken,
      invitedBy: await verifiedUserId(request), // Get from authenticated user
      invitedAt: new Date(),
    });

    await schoolMember.save();

    // Send invitation email
    const invitationLink = buildInvitationLink(invitationType, invitationToken, schoolId, email);

    const emailSubject = `You've been invited to join ${school.name} on Kiddies Check`;
    const emailContent = generateInvitationEmail(
      school.name,
      role,
      invitationLink,
      invitationType
    );

    // Send email asynchronously without blocking the response
    sendEmailViaBrevo(email, emailSubject, emailContent)
      .catch((err) =>
        console.error('Error sending invitation email:', err.message)
      );

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${email}`,
        data: {
          schoolMember: {
            id: schoolMember._id,
            school: schoolMember.school,
            user: schoolMember.user,
            email,
            role: schoolMember.role,
            status: schoolMember.status,
            invitationType,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to invite member',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/school/invite-member?schoolId={schoolId}
 * Get school members
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const status = searchParams.get('status') || 'active';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Valid school ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Get members
    const members = await SchoolMember.find({
      school: schoolId,
      ...(status && { status }),
    })
      .populate('user', 'firstName lastName email avatar lastLogin')
      .populate('invitedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count
    const total = await SchoolMember.countDocuments({
      school: schoolId,
      ...(status && { status }),
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          members,
          pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching school members:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch members',
      },
      { status: 500 }
    );
  }
}

export const POST = withAudit(postHandler);
