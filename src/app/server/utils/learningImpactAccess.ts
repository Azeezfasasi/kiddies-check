import { connectDB } from "@/utils/db";
import User from "@/app/server/models/User";
import SchoolMember from "@/app/server/models/SchoolMember";

/**
 * Check if user has access to a school's learning impact data.
 * Mirrors the access pattern used in /api/teacher/assessments.
 *
 * @param {string} userId
 * @param {string} schoolId
 * @returns {Promise<boolean>}
 */
export async function checkSchoolAccess(userId, schoolId) {
  if (!userId || !schoolId) return false;

  await connectDB();
  const user = await User.findById(userId);
  if (!user) return false;

  const hasSchoolAccess =
    user.role === "admin" ||
    user.role === "learning-specialist" ||
    (user.schoolId && user.schoolId.toString() === schoolId) ||
    (user.managedSchools && user.managedSchools.some((id) => id.toString() === schoolId)) ||
    !!(await SchoolMember.findOne({
      user: userId,
      school: schoolId,
      status: "active",
    }));

  return hasSchoolAccess;
}

