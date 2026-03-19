/**
 * POST /api/auth/verify-registration-otp
 * Verify OTP code during registration
 */

import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import { sendAdminPendingNotification } from '@/app/server/utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const { email, otp } = await request.json();

    // Validation
    if (!email || !otp) {
      return Response.json(
        { success: false, message: 'Email and OTP are required' },
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

    console.log(`Verifying OTP for: ${email}`);
    console.log(`OTP Entered: ${otp}`);
    console.log(`OTP Stored (hash): ${user.registrationOTP}`);
    console.log(`OTP Expires: ${user.registrationOTPExpires} (now: ${Date.now()})`);
    console.log(`OTP Verified flag: ${user.registrationOTPVerified}`);

    // Check if already verified
    if (user.registrationOTPVerified) {
      return Response.json(
        { success: false, message: 'OTP already verified' },
        { status: 400 }
      );
    }

    // Verify OTP using model method
    const isOtpValid = await user.verifyRegistrationOTP(otp);

    console.log(`OTP Valid Result: ${isOtpValid}`);

    if (!isOtpValid) {
      // OTP is invalid or expired
      await user.save();
      
      return Response.json(
        {
          success: false,
          message: user.registrationOTPAttempts >= 3
            ? 'Maximum OTP attempts exceeded. Please register again.'
            : 'Invalid or expired OTP. Please try again.',
          attemptsLeft: Math.max(0, 3 - user.registrationOTPAttempts),
        },
        { status: 401 }
      );
    }

    // OTP is valid - mark as verified and set approval status
    user.registrationOTPVerified = true;
    user.approvalStatus = 'pending';
    user.approvedAt = null; // Reset approval timestamp

    await user.save();

    // Send admin notification email
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@kiddiescheck.com';
      
      await sendAdminPendingNotification(
        adminEmail,
        user.firstName,
        user.lastName,
        user.email,
        user.school || 'School Name Not Provided',
        user.model || 'Model Not Specified',
        user.location || 'Location Not Specified',
        user.numberOfStudents || 0,
        user.numberOfTeachers || 0
      );
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
      // Don't fail the OTP verification due to email issues
    }

    return Response.json(
      {
        success: true,
        message: 'OTP verified successfully. Your registration is now pending admin approval.',
        registrationOTPVerified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return Response.json(
      { success: false, message: 'Failed to verify OTP', error: error.message },
      { status: 500 }
    );
  }
}
