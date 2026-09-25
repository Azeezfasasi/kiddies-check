import { type NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/app/server/models/User';
import School from '@/app/server/models/School';
import { connectDB } from '@/app/server/db/connect';
import { hasAllSchoolAccess } from '@/utils/roles';
import { legacy, type LegacySchoolFields } from "@/types/legacy";

/**
 * POST /api/school/switch
 * Switch the active school for admin/learning-specialist users
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { schoolId } = await request.json();
    const userId = request.headers.get('x-user-id');

    // Validate input
    if (!schoolId || !userId) {
      return NextResponse.json(
        { success: false, error: 'School ID and user ID are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid school ID' },
        { status: 400 }
      );
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Admins, learning-specialists and platform support roles can switch schools
    if (!hasAllSchoolAccess(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Your role cannot switch schools' },
        { status: 403 }
      );
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    // Admin and learning-specialist can switch to any school
    // No access control needed - they have full access

    return NextResponse.json(
      {
        success: true,
        message: `Switched to ${school.name}`,
        data: {
          activeSchoolId: schoolId,
          school: {
            id: school._id,
            name: school.name,
            email: school.email,
            location: school.location,
            logo: school.logo || legacy<LegacySchoolFields>(school).schoolLogo || '',
            schoolLogo: school.logo || legacy<LegacySchoolFields>(school).schoolLogo || '',
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error switching school:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to switch school',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/school/switch
 * Get list of schools the user can access
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user without populating first
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get accessible schools
    let accessibleSchools = [];

    if (hasAllSchoolAccess(user.role)) {
      // For admins/learning-specialists/support roles, fetch ALL schools in the database
      accessibleSchools = await School.find({}, 'name email location logo _id').sort({ name: 1 });
    } else if (user.schoolId) {
      // Return primary school for regular users
      const school = await School.findById(user.schoolId).select('name email location logo');
      if (school) {
        accessibleSchools = [school];
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          schools: accessibleSchools,
          currentRole: user.role,
          primarySchoolId: user.schoolId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching accessible schools:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch accessible schools',
      },
      { status: 500 }
    );
  }
}
