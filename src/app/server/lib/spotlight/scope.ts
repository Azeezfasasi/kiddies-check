import { Types } from "mongoose";
import School from "@/app/server/models/School";
import SchoolMember from "@/app/server/models/SchoolMember";
import type { UserDocument } from "@/app/server/models/User";
import { hasAllSchoolAccess } from "@/utils/roles";

/** Roles that see every school, plus everyone else's own leadership schools. */
const LEADERSHIP_ROLES = ["school-leader", "learning-specialist"];

export interface SpotlightScope {
  /** True when the user oversees more than one school and lands on the network view. */
  network: boolean;
  schoolIds: Types.ObjectId[];
}

/**
 * The schools a user may see in Spotlight, or null when the role has no
 * Spotlight access (teachers, parents).
 */
export async function resolveScope(user: UserDocument): Promise<SpotlightScope | null> {
  if (user.role === "admin" || hasAllSchoolAccess(user.role)) {
    const schools = await School.find({ isActive: true, approvalStatus: { $ne: "rejected" } }).select("_id").lean();
    return { network: true, schoolIds: schools.map((s) => s._id as Types.ObjectId) };
  }

  const ids = new Set<string>();
  (user.managedSchools ?? []).forEach((id) => ids.add(String(id)));
  if (LEADERSHIP_ROLES.includes(user.role) && user.schoolId) ids.add(String(user.schoolId));
  const memberships = await SchoolMember.find({ user: user._id, role: { $in: LEADERSHIP_ROLES }, status: "active" })
    .select("school")
    .lean();
  memberships.forEach((m) => ids.add(String(m.school)));

  if (ids.size === 0) return null;
  const schools = await School.find({ _id: { $in: [...ids] }, isActive: true }).select("_id").lean();
  if (schools.length === 0) return null;
  return { network: schools.length > 1, schoolIds: schools.map((s) => s._id as Types.ObjectId) };
}

export const inScope = (scope: SpotlightScope, schoolId: unknown) =>
  scope.schoolIds.some((id) => String(id) === String(schoolId));
