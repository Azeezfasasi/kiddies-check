/**
 * POST /api/auth/verify-registration-otp
 * Verify OTP code during registration
 */

import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import ProspectiveStudent from '@/app/server/models/ProspectiveStudent';
import { sendAdminPendingNotification } from '@/app/server/utils/emailService';

export async function POST(request) {
  try {
    await connectDB();

    const { email, otp, children } = await request.json();

    console.log('========== OTP Verification Started ==========');
    console.log(`[OTP] Email: ${email}`);
    console.log(`[OTP] OTP entered: ${otp ? '✅ provided' : '❌ missing'}`);
    console.log(`[OTP] Children data: ${children ? '✅ provided - ' + JSON.stringify(children) : '❌ missing'}`);

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

    // Log for debugging
    console.log(`[OTP Verification] User role: ${user.role}`);
    console.log(`[OTP Verification] Children received: ${children ? JSON.stringify(children) : 'none'}`);
    console.log(`[OTP Verification] User schoolId: ${user.schoolId}`);
    console.log(`[OTP Verification] User schoolType: ${user.schoolType}`);

    // If parent registered with children, create prospective student records
    if (user.role === 'parent' && children && Array.isArray(children) && children.length > 0) {
      if (!user.schoolId) {
        console.warn(`[OTP Verification] Parent ${email} has no schoolId set. Cannot create prospective students.`);
        console.log(`[OTP Verification] User data:`, {
          role: user.role,
          schoolId: user.schoolId,
          schoolType: user.schoolType,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } else {
        try {
          for (const child of children) {
            // Create prospective student record for each child
            const prospectiveStudent = new ProspectiveStudent({
              firstName: child.firstName || '',
              lastName: child.lastName || '',
              gradeLevel: child.grade || '',
              className: child.className || '',
              classId: null, // Will be linked after class selection
              school: user.schoolId,
              schoolType: user.schoolType || '',
              picture: null,
              phone: null,
              email: user.email,
              registeredBy: user._id,
              parentId: user._id,
              parentName: `${user.firstName} ${user.lastName}`,
              parentEmail: user.email,
              parentPhone: user.phone,
              status: 'pending',
              createdAt: new Date(),
            });
            
            console.log(`[OTP Verification] ProspectiveStudent object created for: ${child.firstName} ${child.lastName}`);
            console.log(`[OTP Verification] Data:`, {
              firstName: prospectiveStudent.firstName,
              school: prospectiveStudent.school?.toString(),
              parentId: prospectiveStudent.parentId?.toString(),
              status: prospectiveStudent.status,
            });
            
            await prospectiveStudent.save();
            console.log(`[OTP Verification] ✅ Saved prospective student: ${child.name}`);
          }
          console.log(`[OTP Verification] ✅ Created ${children.length} prospective student records for parent: ${email}`);
        } catch (prospectiveError) {
          console.error('[OTP Verification] ❌ Error creating prospective students:');
          console.error('[OTP Verification] Error name:', prospectiveError.name);
          console.error('[OTP Verification] Error message:', prospectiveError.message);
          console.error('[OTP Verification] Error details:', prospectiveError);
          if (prospectiveError.errors) {
            console.error('[OTP Verification] Validation errors:', prospectiveError.errors);
          }
          // Don't fail OTP verification due to prospective student creation issues
        }
      }
    }

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
