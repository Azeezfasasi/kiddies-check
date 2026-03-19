/**
 * /api/admin/registrations
 * Handle admin approval/rejection of pending registrations
 */

import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import { sendApprovalEmail, sendRejectionEmail } from '@/app/server/utils/emailService';
import jwt from 'jsonwebtoken';

// Middleware to verify admin token
const verifyAdminToken = (req) => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    return null;
  }
};

// Middleware to check if user is admin
const isAdmin = async (userId) => {
  const user = await User.findById(userId);
  return user && user.role === 'admin';
};

/**
 * GET /api/admin/registrations
 * Get all pending registrations
 */
export async function GET(request) {
  try {
    await connectDB();

    // Verify admin
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json(
        { success: false, message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const adminCheck = await isAdmin(decoded.id);
    if (!adminCheck) {
      return Response.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all pending registrations
    const pendingRegistrations = await User.find({
      approvalStatus: 'pending',
      registrationOTPVerified: true,
    })
      .select('-password -registrationOTP')
      .sort({ createdAt: -1 });

    return Response.json(
      {
        success: true,
        count: pendingRegistrations.length,
        registrations: pendingRegistrations,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return Response.json(
      { success: false, message: 'Failed to fetch registrations', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/registrations/approve
 * Approve a pending registration
 */
export async function PUT(request) {
  try {
    await connectDB();

    // Verify admin
    const decoded = verifyAdminToken(request);
    if (!decoded) {
      return Response.json(
        { success: false, message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const adminCheck = await isAdmin(decoded.id);
    if (!adminCheck) {
      return Response.json(
        { success: false, message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, rejectionReason } = body;

    if (!userId || !action || !['approve', 'reject'].includes(action)) {
      return Response.json(
        { success: false, message: 'userId and action (approve/reject) are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return Response.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (user.approvalStatus !== 'pending') {
      return Response.json(
        {
          success: false,
          message: `Registration already ${user.approvalStatus}`,
        },
        { status: 400 }
      );
    }

    const admin = await User.findById(decoded.id);

    if (action === 'approve') {
      // Approve registration
      user.approvalStatus = 'approved';
      user.approvedAt = new Date();
      user.approvedBy = admin._id;

      await user.save();

      // Send approval email
      try {
        await sendApprovalEmail(user.email, user.firstName, user.school);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Don't fail the approval due to email issues
      }

      return Response.json(
        {
          success: true,
          message: `Registration approved for ${user.firstName} ${user.lastName}`,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            school: user.school,
            approvalStatus: user.approvalStatus,
            approvedAt: user.approvedAt,
          },
        },
        { status: 200 }
      );
    } else if (action === 'reject') {
      // Reject registration
      if (!rejectionReason) {
        return Response.json(
          { success: false, message: 'rejectionReason is required for rejection' },
          { status: 400 }
        );
      }

      user.approvalStatus = 'rejected';
      user.rejectionReason = rejectionReason;
      user.approvedAt = new Date();
      user.approvedBy = admin._id;

      await user.save();

      // Send rejection email
      try {
        await sendRejectionEmail(user.email, user.firstName, user.school, rejectionReason);
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Don't fail the rejection due to email issues
      }

      return Response.json(
        {
          success: true,
          message: `Registration rejected for ${user.firstName} ${user.lastName}`,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            school: user.school,
            approvalStatus: user.approvalStatus,
            rejectionReason: user.rejectionReason,
          },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error processing registration:', error);
    return Response.json(
      { success: false, message: 'Failed to process registration', error: error.message },
      { status: 500 }
    );
  }
}
