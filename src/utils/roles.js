/**
 * Central role & permission map, shared by API routes and the dashboard UI.
 *
 * The original roles (admin, learning-specialist, school-leader, teacher,
 * parent) are still checked by name throughout the codebase. The platform
 * support roles below are granted access feature-by-feature through `can()`,
 * so existing checks read: `["admin", ...].includes(role) || can(role, feature, level)`.
 */

export const ROLE_LABELS = {
  admin: "Admin",
  "learning-specialist": "Learning Specialist",
  "school-leader": "School Leader",
  teacher: "Teacher",
  parent: "Parent",
  "support-staff": "Support Staff",
  "it-support": "IT Support",
  "school-director": "School Director",
  "school-coordinator": "School Coordinator",
  "service-desk": "Service Desk",
  "media-manager": "Media Manager",
  "content-manager": "Content Manager",
};

export const ORIGINAL_ROLES = ["admin", "learning-specialist", "school-leader", "teacher", "parent"];
export const PLATFORM_ROLES = [
  "support-staff",
  "it-support",
  "school-director",
  "school-coordinator",
  "service-desk",
  "media-manager",
  "content-manager",
];
export const ALL_ROLES = [...ORIGINAL_ROLES, ...PLATFORM_ROLES];

export const roleLabel = (role) => ROLE_LABELS[role] || (role ? role.replace(/-/g, " ") : "User");

const VIEW = 1;
const EDIT = 2;
const MANAGE = 3;
const LEVELS = { view: VIEW, edit: EDIT, manage: MANAGE };

/**
 * Features:
 *   blog, gallery, newsletter, site-content (homepage + about page),
 *   contact-responses, registrations, schools, prospective, calendar,
 *   promotion, billing, school-manager, academics (learning specialist
 *   pages), report-cards, cbt, logs, users, deleted-data
 *
 * Levels: view < edit < manage. Only billing uses "manage" (set class fees,
 * discounts, waivers, voiding); "edit" there means recording payments.
 */
const PERMISSIONS = {
  "support-staff": {
    schools: EDIT,
    promotion: EDIT,
    billing: VIEW,
    "school-manager": EDIT,
    academics: EDIT,
    "report-cards": EDIT,
    cbt: EDIT,
    logs: VIEW,
  },
  "it-support": {
    blog: EDIT,
    gallery: EDIT,
    newsletter: EDIT,
    "site-content": EDIT,
    "contact-responses": EDIT,
    registrations: EDIT,
    schools: EDIT,
    prospective: EDIT,
    calendar: VIEW,
    promotion: VIEW,
    billing: VIEW,
    "school-manager": EDIT,
    academics: EDIT,
    "report-cards": EDIT,
    cbt: EDIT,
    logs: VIEW,
    users: EDIT,
    "deleted-data": EDIT,
  },
  "school-director": {
    registrations: EDIT,
    schools: EDIT,
    prospective: EDIT,
    calendar: EDIT,
    promotion: EDIT,
    billing: MANAGE,
    "school-manager": EDIT,
    academics: EDIT,
    "report-cards": EDIT,
    cbt: EDIT,
    logs: VIEW,
  },
  "school-coordinator": {
    promotion: VIEW,
    billing: VIEW,
    "school-manager": EDIT,
    academics: EDIT,
    "report-cards": EDIT,
    cbt: EDIT,
    logs: VIEW,
  },
  "service-desk": {
    registrations: EDIT,
    schools: EDIT,
    prospective: EDIT,
    promotion: VIEW,
    billing: VIEW,
    "school-manager": EDIT,
    academics: EDIT,
    "report-cards": EDIT,
    cbt: EDIT,
    "contact-responses": EDIT,
  },
  "media-manager": {
    blog: EDIT,
    gallery: EDIT,
  },
  "content-manager": {
    "site-content": EDIT,
    blog: EDIT,
    newsletter: EDIT,
    "contact-responses": EDIT,
  },
};

// Platform roles that support every school and can use the school switcher.
const ALL_SCHOOL_PLATFORM_ROLES = ["support-staff", "it-support", "school-director", "school-coordinator", "service-desk"];

/** Does a platform role have `feature` at `level` or above? Always false for original roles. */
export const can = (role, feature, level = "view") => (PERMISSIONS[role]?.[feature] || 0) >= LEVELS[level];

/** Can this role see and act on every school (and use the school switcher)? */
export const hasAllSchoolAccess = (role) =>
  role === "admin" || role === "learning-specialist" || ALL_SCHOOL_PLATFORM_ROLES.includes(role);

/** Existing role list plus every platform role that has `feature` at `level`. */
export const withFeature = (roles, feature, level = "view") => [
  ...roles,
  ...PLATFORM_ROLES.filter((role) => !roles.includes(role) && can(role, feature, level)),
];

/**
 * Cross-school academic privileges: what `["admin", "learning-specialist"].includes(role)`
 * meant in the class/student/subject/attendance routes, extended to the
 * platform roles that have the Learning Specialist and School Manager pages.
 */
export const isAcademicAdmin = (role) =>
  role === "admin" || role === "learning-specialist" || can(role, "academics", "edit");

/** One of the platform support roles (not tied to a single school's membership). */
export const isPlatformRole = (role) => PLATFORM_ROLES.includes(role);
