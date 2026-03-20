import { NextResponse } from 'next/server';
import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import School from '@/app/server/models/School';

/**
 * POST /api/admin/setup-school-access
 * 
 * Assign schools to an admin/learning-specialist user
 * 
 * Body:
 * {
 *   adminEmail: string,
 *   schoolIds: string[] (array of school IDs)
 * }
 */
export async function POST(request) {
  try {
    await connectDB();

    const { adminEmail, schoolIds } = await request.json();

    // Validate inputs
    if (!adminEmail || !Array.isArray(schoolIds) || schoolIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Admin email and at least one school ID required' },
        { status: 400 }
      );
    }

    // Find admin user
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User not found: ${adminEmail}` },
        { status: 404 }
      );
    }

    // Verify user is admin or learning-specialist
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: `User ${adminEmail} is not an admin or learning-specialist` },
        { status: 403 }
      );
    }

    // Verify all schools exist
    const schools = await School.find({ _id: { $in: schoolIds } });
    if (schools.length !== schoolIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more schools not found' },
        { status: 404 }
      );
    }

    // Update user's managedSchools
    user.managedSchools = schoolIds;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: `${user.firstName} ${user.lastName} now manages ${schools.length} school(s)`,
        data: {
          email: user.email,
          role: user.role,
          managedSchools: schools.map(s => ({
            id: s._id,
            name: s.name,
            email: s.email,
            location: s.location
          }))
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting up school access:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to setup school access'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/setup-school-access?adminEmail=...&schoolId=...
 * 
 * Quick setup to add a single school to an admin (Query params version)
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');
    const schoolId = searchParams.get('schoolId');

    if (!adminEmail || !schoolId) {
      return NextResponse.json(
        { success: false, error: 'adminEmail and schoolId query parameters required' },
        { status: 400 }
      );
    }

    // Find admin user
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User not found: ${adminEmail}` },
        { status: 404 }
      );
    }

    // Verify user is admin or learning-specialist
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: `User ${adminEmail} is not an admin or learning-specialist` },
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

    // Add school to managedSchools if not already there
    if (!user.managedSchools.includes(schoolId)) {
      user.managedSchools.push(schoolId);
      await user.save();
    }

    return NextResponse.json(
      {
        success: true,
        message: `${user.firstName} ${user.lastName} now has access to ${school.name}`,
        data: {
          email: user.email,
          role: user.role,
          school: {
            id: school._id,
            name: school.name,
            email: school.email,
            location: school.location
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting up school access:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to setup school access'
      },
      { status: 500 }
    );
  }
}
