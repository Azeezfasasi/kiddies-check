import { NextResponse } from 'next/server';
import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import School from '@/app/server/models/School';

/**
 * GET /api/debug/admin-schools?userId=...
 * Debug endpoint to check admin user's managedSchools and all available schools
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId query parameter required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findById(userId).populate('managedSchools');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all schools
    const allSchools = await School.find({}, 'name email location approvalStatus isActive createdAt');

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          managedSchoolsCount: user.managedSchools?.length || 0,
          managedSchools: (user.managedSchools || []).map(s => ({
            id: s._id,
            name: s.name,
            email: s.email,
            location: s.location
          }))
        },
        allSchools: allSchools.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          location: s.location,
          approvalStatus: s.approvalStatus,
          isActive: s.isActive,
          createdAt: s.createdAt
        })),
        totalSchoolsInDB: allSchools.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch debug info'
      },
      { status: 500 }
    );
  }
}
