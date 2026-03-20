import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import SchoolMember from '@/app/server/models/SchoolMember';
import School from '@/app/server/models/School';
import User from '@/app/server/models/User';
import crypto from 'crypto';
import { connectDB } from '@/app/server/db/connect';

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'info@kiddiescheck.org';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Kiddies Check Team';

// Helper function to send emails via Brevo
const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Brevo API error:', errorData);
      throw new Error(`Email service error: ${errorData.message || 'Failed to send email'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email via Brevo:', error.message);
    throw error;
  }
};

/**
 * POST /api/school/invite-member
 * Invite a member to join the school
 */
export async function POST(request) {
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
    const validRoles = ['school-leader', 'teacher', 'parent', 'staff'];
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
      invitedBy: request.headers.get('x-user-id'), // Get from authenticated user
      invitedAt: new Date(),
    });

    await schoolMember.save();

    // Send invitation email
    const invitationLink =
      invitationType === 'new-user'
        ? `${process.env.NEXT_PUBLIC_APP_URL}/register?invitationToken=${invitationToken}&schoolId=${schoolId}&email=${encodeURIComponent(email)}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

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
export async function GET(request) {
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
      .populate('user', 'firstName lastName email avatar')
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

/**
 * Helper function to generate invitation email HTML
 */
function generateInvitationEmail(schoolName, role, link, invitationType) {
  const actionText =
    invitationType === 'new-user' ? 'Set Up Your Account' : 'Access Dashboard';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #3b82f6, #9333ea); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Welcome to Kiddies Check!</h2>
      </div>
      
      <div style="padding: 20px; background: #f9fafb;">
        <p>Hello,</p>
        
        <p>You've been invited to join <strong>${schoolName}</strong> as a <strong>${role.replace('-', ' ')}</strong>.</p>
        
        ${
          invitationType === 'new-user'
            ? '<p>Please click the button below to create your account and get started:</p>'
            : '<p>You can now access the school dashboard:</p>'
        }
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${actionText}
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br/>
          <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${link}</code>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          If you did not expect this invitation, please contact your school administrator.
        </p>
      </div>
    </div>
  `;
}
