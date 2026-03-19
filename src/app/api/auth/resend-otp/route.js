/**
 * POST /api/auth/resend-otp
 * Resend OTP code for registration verification
 */

import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import { sendOtpEmail } from '@/app/server/utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();

    // Validation
    if (!email) {
      return Response.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email and explicitly select the OTP field
    const user = await User.findOne({ email }).select('+registrationOTP');
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already verified or rejected
    if (user.registrationOTPVerified) {
      return Response.json(
        { success: false, message: 'Email already verified' },
        { status: 400 }
      );
    }

    if (user.approvalStatus === 'rejected') {
      return Response.json(
        { success: false, message: 'This registration has been rejected' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = user.generateRegistrationOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await sendOtpEmail(email, user.firstName, otp, user.school);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return Response.json(
        { success: false, message: 'Failed to send OTP email', error: emailError.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        message: 'OTP has been resent to your email',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return Response.json(
      { success: false, message: 'Failed to resend OTP', error: error.message },
      { status: 500 }
    );
  }
}
