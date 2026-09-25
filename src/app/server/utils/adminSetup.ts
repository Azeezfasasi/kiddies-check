import { connectDB } from '@/app/server/db/connect';
import User from '@/app/server/models/User';
import School from '@/app/server/models/School';

/**
 * Helper script to set up admin/learning-specialist users with multi-school access
 * 
 * Usage in backend:
 * - Import and call setupAdminSchoolAccess(adminEmail, [schoolIds])
 * - Or use the API endpoint /api/admin/setup-school-access
 */

export async function setupAdminSchoolAccess(adminEmail, schoolIds) {
  try {
    await connectDB();

    // Validate inputs
    if (!adminEmail || !Array.isArray(schoolIds) || schoolIds.length === 0) {
      throw new Error('Email and at least one school ID required');
    }

    // Find admin user
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      throw new Error(`User not found: ${adminEmail}`);
    }

    // Verify user is admin or learning-specialist
    if (!['admin', 'learning-specialist'].includes(user.role)) {
      throw new Error(`User ${adminEmail} is not an admin or learning-specialist`);
    }

    // Verify all schools exist
    const schools = await School.find({ _id: { $in: schoolIds } });
    if (schools.length !== schoolIds.length) {
      throw new Error('One or more schools not found');
    }

    // Update user's managedSchools
    user.managedSchools = schoolIds;
    await user.save();

    return {
      success: true,
      message: `Configured ${user.firstName} ${user.lastName} to manage ${schoolIds.length} school(s)`,
      user: {
        email: user.email,
        role: user.role,
        managedSchools: schoolIds.length,
        schools: schools.map(s => ({ id: s._id, name: s.name }))
      }
    };
  } catch (error) {
    console.error('Setup error:', error);
    throw error;
  }
}

export async function addSchoolToAdmin(adminEmail, schoolId) {
  try {
    await connectDB();

    // Find admin
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      throw new Error(`User not found: ${adminEmail}`);
    }

    if (!['admin', 'learning-specialist'].includes(user.role)) {
      throw new Error(`User is not an admin or learning-specialist`);
    }

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school) {
      throw new Error('School not found');
    }

    // Add if not already in list
    if (!user.managedSchools.includes(schoolId)) {
      user.managedSchools.push(schoolId);
      await user.save();
    }

    return {
      success: true,
      message: `Added ${school.name} to ${user.firstName}'s managed schools`,
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function removeSchoolFromAdmin(adminEmail, schoolId) {
  try {
    await connectDB();

    // Find admin
    const user = await User.findOne({ email: adminEmail });
    if (!user) {
      throw new Error(`User not found: ${adminEmail}`);
    }

    // Remove school from list
    user.managedSchools = user.managedSchools.filter(id => id.toString() !== schoolId.toString());
    await user.save();

    return {
      success: true,
      message: `Removed school from ${user.firstName}'s managed schools`,
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getAdminManagedSchools(adminEmail) {
  try {
    await connectDB();

    const user = await User.findOne({ email: adminEmail }).populate('managedSchools', 'name email location');
    if (!user) {
      throw new Error(`User not found: ${adminEmail}`);
    }

    return {
      email: user.email,
      role: user.role,
      managedSchools: user.managedSchools || [],
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
