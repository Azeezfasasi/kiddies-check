import { NextResponse } from 'next/server';
import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import School from '@/app/server/models/School';

/**
 * POST /api/admin/sync-admin-schools
 * 
 * Sync all existing schools to admin user's managedSchools
 * This is a one-time migration for existing schools created before the fix
 * 
 * Query params:
 * ?adminEmail=email@example.com
 */
export async function POST(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');

    if (!adminEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'adminEmail query parameter required. Usage: /api/admin/sync-admin-schools?adminEmail=admin@example.com' 
        },
        { status: 400 }
      );
    }

    // Find admin user
    const user = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User not found: ${adminEmail}` },
        { status: 404 }
      );
    }

    // Verify user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: `User ${adminEmail} is not an admin` },
        { status: 403 }
      );
    }

    // Get all active schools
    const allSchools = await School.find({ isActive: true }, '_id name email');

    if (allSchools.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No schools found to sync',
          data: {
            email: user.email,
            schoolsSynced: 0,
            totalSchools: 0
          }
        },
        { status: 200 }
      );
    }

    // Update user to have all schools in managedSchools
    const schoolIds = allSchools.map(s => s._id);
    user.managedSchools = schoolIds;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: `Synced ${schoolIds.length} school(s) to admin's managedSchools`,
        data: {
          email: user.email,
          role: user.role,
          schoolsSynced: schoolIds.length,
          schools: allSchools.map(s => ({
            id: s._id,
            name: s.name,
            email: s.email
          }))
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync schools'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/sync-admin-schools?adminEmail=...
 * Check current sync status
 */
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');

    if (!adminEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'adminEmail query parameter required' 
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: adminEmail.toLowerCase() }).populate('managedSchools', 'name email');
    if (!user) {
      return NextResponse.json(
        { success: false, error: `User not found: ${adminEmail}` },
        { status: 404 }
      );
    }

    const allSchools = await School.find({ isActive: true }, '_id name email');

    return NextResponse.json(
      {
        success: true,
        data: {
          email: user.email,
          role: user.role,
          managedSchoolsCount: user.managedSchools?.length || 0,
          totalActiveSchools: allSchools.length,
          managedSchools: (user.managedSchools || []).map(s => ({
            id: s._id,
            name: s.name,
            email: s.email
          }))
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check sync status'
      },
      { status: 500 }
    );
  }
}
