import mongoose from "mongoose";
import type { UserDocument } from "@/app/server/models/User";
import School from "@/app/server/models/School";
import SchoolMember from "@/app/server/models/SchoolMember";
import Student from "@/app/server/models/Student";
import { can, hasAllSchoolAccess, roleLabel, type Feature } from "@/utils/roles";

/**
 * What the signed-in user may see through the AI assistant. Every tool reads
 * data through this scope, so the assistant can never return more than the
 * user could see in the dashboard.
 */
export interface AiScope {
  user: UserDocument;
  role: string;
  roleLabel: string;
  isAdmin: boolean;
  /** true when the user covers every school (admin and cross-school roles). */
  allSchools: boolean;
  /** Schools the user belongs to (empty when allSchools). */
  schoolIds: string[];
  /** The school selected in the dashboard header, if any. */
  activeSchool: { _id: string; name: string } | null;
  /** Parents only: their own children. */
  childIds: string[];
  canRead: (feature: Feature) => boolean;
}

// Read access for the original roles (the platform roles use the shared
// permission map in utils/roles). Mirrors what each role can open in the
// dashboard.
const ORIGINAL_ROLE_FEATURES: Record<string, Feature[]> = {
  "learning-specialist": [
    "academics", "report-cards", "cbt", "prospective", "promotion", "billing", "school-manager",
    "calendar", "logs", "registrations", "schools", "blog", "gallery", "newsletter", "site-content", "contact-responses",
  ],
  "school-leader": ["academics", "report-cards", "cbt", "prospective", "promotion", "billing", "school-manager", "calendar", "logs"],
  teacher: ["academics", "report-cards", "cbt", "calendar"],
  parent: [],
};

export async function buildAiScope(user: UserDocument, activeSchoolId?: string | null): Promise<AiScope> {
  const role = user.role;
  const isAdmin = role === "admin";
  const allSchools = isAdmin || hasAllSchoolAccess(role);

  const schoolIds = new Set<string>();
  if (!allSchools) {
    if (user.schoolId) schoolIds.add(user.schoolId.toString());
    const memberships = await SchoolMember.find({ user: user._id, status: "active" }).select("school").lean();
    for (const m of memberships) if (m.school) schoolIds.add(m.school.toString());
  }

  const childIds: string[] = [];
  if (role === "parent") {
    const children = await Student.find({ parent: user._id }).select("_id school").lean();
    for (const c of children) {
      childIds.push(c._id.toString());
      if (c.school) schoolIds.add(c.school.toString());
    }
  }

  // The header's school switcher only applies to schools the user may see.
  let activeSchool: AiScope["activeSchool"] = null;
  const candidate = activeSchoolId && mongoose.isValidObjectId(activeSchoolId)
    ? activeSchoolId
    : !allSchools && schoolIds.size ? [...schoolIds][0] : null;
  if (candidate && (allSchools || schoolIds.has(candidate))) {
    const school = await School.findById(candidate).select("name").lean();
    if (school) activeSchool = { _id: school._id.toString(), name: school.name };
  }

  const originalFeatures = ORIGINAL_ROLE_FEATURES[role];
  const canRead = (feature: Feature) =>
    isAdmin || (originalFeatures ? originalFeatures.includes(feature) : can(role, feature, "view"));

  return {
    user,
    role,
    roleLabel: roleLabel(role),
    isAdmin,
    allSchools,
    schoolIds: [...schoolIds],
    activeSchool,
    childIds,
    canRead,
  };
}

/**
 * Resolves the schools a query should cover. A requested school must be in
 * scope; otherwise all accessible schools (admins/cross-school: no filter).
 * Returns null for "no restriction", or an id list (possibly empty = none).
 */
export function resolveSchools(scope: AiScope, requested?: string | null): string[] | null {
  if (requested) {
    if (!mongoose.isValidObjectId(requested)) return [];
    return scope.allSchools || scope.schoolIds.includes(requested) ? [requested] : [];
  }
  return scope.allSchools ? null : scope.schoolIds;
}

/** Adds a `school` condition to a Mongo filter for the resolved schools. */
export function schoolFilter(schools: string[] | null, field = "school"): Record<string, unknown> {
  if (schools === null) return {};
  return { [field]: { $in: schools.map((id) => new mongoose.Types.ObjectId(id)) } };
}
