import { NextResponse } from 'next/server';
import User from '@/app/server/models/User';
import School from '@/app/server/models/School';
import { connectDB } from '@/app/server/db/connect';

/**
 * GET /api/admin/migrate-school-ids
 * Helper endpoint to link existing users to schools
 * WARNING: Only use this once to migrate data!
 */
export async function GET(request) {
  try {
    await connectDB();

    // Check if this is an admin request (optional - add auth checks)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.includes('admin-migration-token')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let updated = 0;
    let skipped = 0;
    const errors = [];

    // Find all users without schoolId
    const usersWithoutSchoolId = await User.find({ 
      schoolId: { $exists: false } 
    });

    for (const user of usersWithoutSchoolId) {
      try {
        // Skip if no school name
        if (!user.schoolName && !user.school) {
          skipped++;
          continue;
        }

        const schoolName = user.schoolName || user.school;

        // Find or create school
        let school = await School.findOne({ name: schoolName });
        
        if (!school) {
          school = new School({
            name: schoolName,
            email: user.email,
            location: user.location || '',
            model: user.model || '',
            numberOfTeachers: user.numberOfTeachers || 0,
            numberOfStudents: user.numberOfStudents || 0,
            logo: user.schoolLogo || '',
            approvalStatus: 'pending',
            isActive: true,
          });
          await school.save();
        }

        // Update user with schoolId
        user.schoolId = school._id;
        await user.save({ validateBeforeSave: false });

        // If user is school-leader, set as principal
        if (user.role === 'school-leader' && !school.principal) {
          school.principal = user._id;
          await school.save();
        }

        updated++;
      } catch (err) {
        errors.push({
          userId: user._id,
          email: user.email,
          error: err.message,
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Migration completed',
        stats: {
          updated,
          skipped,
          errors: errors.length,
          errorDetails: errors,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Migration failed',
      },
      { status: 500 }
    );
  }
}
