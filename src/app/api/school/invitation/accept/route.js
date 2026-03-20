import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import User from '@/app/server/models/User';
import { connectDB } from '@/app/server/db/connect';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

/**
 * POST /api/school/invitation/accept
 * Accept a school invitation and complete registration for invited users
 * 
 * For existing members: { memberId, userId }
 * For invited users: { invitationToken, schoolId, firstName, lastName, email, phone, password, confirmPassword }
 */
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { memberId, userId, invitationToken, schoolId, firstName, lastName, email, phone, password, confirmPassword } = body;

    // Handle existing user accepting invitation
    if (memberId && userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID' },
          { status: 400 }
        );
      }

      // Verify the member exists and belongs to this user
      const member = await SchoolMember.findOne({
        _id: memberId,
        user: userId,
      }).populate('school');

      if (!member) {
        return NextResponse.json(
          { success: false, error: 'Invitation not found' },
          { status: 404 }
        );
      }

      // Update member status
      member.status = 'active';
      member.acceptedAt = new Date();
      member.invitationToken = undefined;
      member.invitationExpires = undefined;
      await member.save();

      // Mark user as active if this is their first school
      const user = await User.findById(userId);
      if (user && !user.isActive) {
        user.isActive = true;
        user.isEmailVerified = true;
        await user.save();
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Invitation accepted',
          data: member,
        },
        { status: 200 }
      );
    }

    // Handle invited user registration
    if (!invitationToken || !schoolId || !firstName || !lastName || !email || !phone || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for invitation acceptance' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match' },
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
    }).populate('school').populate('user');

    if (!schoolMember) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    if (schoolMember.status !== 'invited') {
      return NextResponse.json(
        { success: false, error: 'This invitation has already been accepted' },
        { status: 409 }
      );
    }

    // Get or update the user
    let user = schoolMember.user;
    if (user && typeof user === 'string') {
      user = await User.findById(user);
    }

    if (user) {
      // Update existing pending user
      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.phone = phone;
      user.password = password; // Will be hashed by pre-save hook
      user.isActive = true;
      user.isEmailVerified = true;
      user.schoolId = schoolId;
    } else {
      // This shouldn't happen if invitations are created correctly, but handle it
      user = new User({
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        password,
        schoolId,
        role: schoolMember.role || 'teacher',
        isActive: true,
        isEmailVerified: true,
      });
    }

    await user.save();

    // Mark invitation as accepted
    schoolMember.status = 'active';
    schoolMember.acceptedAt = new Date();
    schoolMember.invitationToken = undefined;
    await schoolMember.save();

    // Generate JWT token
    const token = generateToken(user._id);

    return NextResponse.json(
      {
        success: true,
        message: 'Invitation accepted and profile completed',
        data: {
          token,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            schoolId: user.schoolId,
            role: user.role,
            avatar: user.avatar,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to accept invitation',
      },
      { status: 500 }
    );
  }
}
