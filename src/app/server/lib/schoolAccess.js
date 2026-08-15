// Shared school-scoped access check, matching the pattern used across
// /api/teacher/assessments and /api/report-cards.
export const AUTHORING_ROLES = ["admin", "learning-specialist", "school-leader", "teacher"];

export async function canAccessSchool(user, schoolId) {
  if (!user) return false;
  if (AUTHORING_ROLES.includes(user.role)) {
    if (user.role === "admin" || user.role === "learning-specialist") return true;
    if (user.schoolId && user.schoolId.toString() === schoolId) return true;
    if (user.managedSchools && user.managedSchools.some((id) => id.toString() === schoolId)) return true;
    return false;
  }
  return false;
}
