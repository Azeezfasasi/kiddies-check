import SchoolMember from '@/app/server/models/SchoolMember';
import School from '@/app/server/models/School';

/**
 * Check if user is a member of a school
 * @param {string} userId - The user ID
 * @param {string} schoolId - The school ID
 * @returns {Promise<Object|null>} - School member record or null
 */
export async function getUserSchoolMembership(userId, schoolId) {
  try {
    const membership = await SchoolMember.findOne({
      user: userId,
      school: schoolId,
      status: 'active',
    });
    return membership;
  } catch (error) {
    console.error('Error checking school membership:', error);
    return null;
  }
}

/**
 * Get all schools a user belongs to
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of school objects
 */
export async function getUserSchools(userId) {
  try {
    const memberships = await SchoolMember.find({
      user: userId,
      status: 'active',
    }).populate('school');

    return memberships.map((m) => m.school);
  } catch (error) {
    console.error('Error fetching user schools:', error);
    return [];
  }
}

/**
 * Get school members with a specific role
 * @param {string} schoolId - The school ID
 * @param {string} role - The role to filter by
 * @returns {Promise<Array>} - Array of member objects
 */
export async function getSchoolMembersByRole(schoolId, role) {
  try {
    const members = await SchoolMember.find({
      school: schoolId,
      role,
      status: 'active',
    }).populate('user', 'firstName lastName email');

    return members;
  } catch (error) {
    console.error('Error fetching school members by role:', error);
    return [];
  }
}

/**
 * Check if user has permission in a school
 * @param {string} userId - The user ID
 * @param {string} schoolId - The school ID
 * @param {string} permission - The permission to check
 * @returns {Promise<boolean>}
 */
export async function userHasSchoolPermission(userId, schoolId, permission) {
  try {
    const membership = await SchoolMember.findOne({
      user: userId,
      school: schoolId,
      status: 'active',
    });

    if (!membership) return false;
    if (membership.permissions.includes(permission)) return true;

    // School leaders and staff have additional permissions
    if (
      membership.role === 'school-leader' ||
      membership.role === 'staff'
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking school permission:', error);
    return false;
  }
}

/**
 * Check if user can access a school (supports admins managing multiple schools)
 * @param {Object} user - The user object (with role and managedSchools)
 * @param {string} schoolId - The school ID to check access for
 * @returns {boolean} - Whether user can access this school
 */
export function canUserAccessSchool(user, schoolId) {
  if (!user || !schoolId) return false;

  // Admins and learning-specialists check managedSchools
  if (['admin', 'learning-specialist'].includes(user.role)) {
    if (!user.managedSchools) return false;
    return user.managedSchools.some(id => id.toString() === schoolId.toString());
  }

  // Regular users check their primary school
  if (user.schoolId) {
    return user.schoolId.toString() === schoolId.toString();
  }

  return false;
}

/**
 * Verify user can access school data (supports admins managing multiple schools)
 * Used as middleware to protect school-specific data routes
 * @param {Object} user - The user object
 * @param {string} schoolId - The school ID
 * @throws {Error} - If user doesn't have access
 */
export async function verifySchoolAccessForUser(user, schoolId) {
  const User = require('@/app/server/models/User').default;

  const hasAccess = await canUserAccessSchoolWithMembership(user._id || user.id, schoolId, user.role, user.managedSchools);

  if (!hasAccess) {
    throw new Error('You do not have access to this school');
  }

  return true;
}

/**
 * Check school access including membership and admin override
 * @param {string} userId - The user ID
 * @param {string} schoolId - The school ID
 * @param {string} userRole - The user's role
 * @param {Array} managedSchools - Array of school IDs the user manages
 * @returns {Promise<boolean>}
 */
export async function canUserAccessSchoolWithMembership(userId, schoolId, userRole, managedSchools) {
  try {
    // Admins and learning-specialists with managedSchools
    if (['admin', 'learning-specialist'].includes(userRole)) {
      if (managedSchools && managedSchools.length > 0) {
        return managedSchools.some(id => id.toString() === schoolId.toString());
      }
    }

    // Regular users: check membership
    const membership = await getUserSchoolMembership(userId, schoolId);
    return !!membership;
  } catch (error) {
    console.error('Error checking school access:', error);
    return false;
  }
}

/**
 * Verify user can access school data
 * Used as middleware to protect school-specific data routes
 * @param {string} userId - The user ID
 * @param {string} schoolId - The school ID
 * @throws {Error} - If user doesn't have access
 */
export async function verifySchoolAccess(userId, schoolId) {
  const membership = await getUserSchoolMembership(userId, schoolId);

  if (!membership) {
    throw new Error('You do not have access to this school');
  }

  return membership;
}

/**
 * Get user's primary school (for the dashboard)
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - School object or null
 */
export async function getUserPrimarySchool(userId) {
  try {
    const membership = await SchoolMember.findOne({
      user: userId,
      status: 'active',
    })
      .populate('school')
      .sort({ createdAt: 1 });

    return membership ? membership.school : null;
  } catch (error) {
    console.error('Error fetching user primary school:', error);
    return null;
  }
}
