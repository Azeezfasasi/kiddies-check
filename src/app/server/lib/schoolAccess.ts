import { can, type AccessLevel } from "@/utils/roles";
import SchoolMember from "@/app/server/models/SchoolMember";
// Shared school-scoped access check, matching the pattern used across
// /api/teacher/assessments and /api/report-cards.
export const AUTHORING_ROLES = ["admin", "learning-specialist", "school-leader", "teacher"];

interface SchoolScopedUser {
  _id?: unknown;
  role?: string | null;
  schoolId?: { toString(): string } | null;
  managedSchools?: { toString(): string }[] | null;
}

export async function canAccessSchool(
  user: SchoolScopedUser | null | undefined,
  schoolId: string,
  level: AccessLevel = "edit"
): Promise<boolean> {
  if (!user) return false;
  // Platform support roles with CBT / report-card access work across all schools.
  if (can(user.role, "cbt", level) || can(user.role, "report-cards", level)) return true;
  if (AUTHORING_ROLES.includes(user.role)) {
    if (user.role === "admin") return true;
    if (user.schoolId && user.schoolId.toString() === schoolId) return true;
    // Learning specialists work in a single school, so managedSchools doesn't widen their access
    if (user.role !== "learning-specialist" && user.managedSchools?.some((id) => id.toString() === schoolId)) return true;
    // Members linked through an active school membership rather than User.schoolId
    if (user._id && (await SchoolMember.exists({ user: user._id, school: schoolId, status: "active" }))) return true;
    return false;
  }
  return false;
}
