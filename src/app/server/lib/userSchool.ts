import School from "@/app/server/models/School";

interface UserSchoolFields {
  schoolName?: string | null;
  schoolId?: unknown;
}

/**
 * The display name of a user's school: the name stored at registration
 * (school leaders), otherwise the name of the school `schoolId` points to.
 * Returns undefined when neither is available. Never throws: callers use it
 * for email wording after the main action has already been saved.
 */
export async function getUserSchoolName(user: UserSchoolFields): Promise<string | undefined> {
  if (user.schoolName) return user.schoolName;
  if (!user.schoolId) return undefined;
  try {
    const school = await School.findById(user.schoolId).select("name").lean();
    return school?.name || undefined;
  } catch (error) {
    console.error("Could not look up school name:", error);
    return undefined;
  }
}
