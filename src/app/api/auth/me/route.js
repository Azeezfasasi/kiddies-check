import { NextResponse } from 'next/server';
import User from '@/app/server/models/User';
import jwt from 'jsonwebtoken';

/**
 * GET /api/auth/me
 * Get current user information
 */
export async function GET(request) {
  try {
    // Try to get user ID from JWT token in Authorization header
    const authHeader = request.headers.get('authorization');
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId || decoded.id;
      } catch (err) {
        console.log('Invalid token:', err.message);
      }
    }

    // Fallback: try x-user-id header
    if (!userId) {
      userId = request.headers.get('x-user-id');
    }

    // Fallback: try from localStorage cookie (if using cookie-based auth)
    if (!userId && request.cookies) {
      const userCookie = request.cookies.get('userId');
      if (userCookie) {
        userId = userCookie.value;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user data
    const user = await User.findById(userId)
      .select('_id firstName lastName email schoolId role avatar')
      .populate('schoolId', 'name _id');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          schoolId: user.schoolId?._id || user.schoolId,
          school: user.schoolId,
          role: user.role,
          avatar: user.avatar,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch user data',
      },
      { status: 500 }
    );
  }
}
