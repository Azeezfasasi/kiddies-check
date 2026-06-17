/**
 * Utility functions for teacher school assignment
 */

/**
 * Get or fetch teacher's school ID
 * First checks localStorage, then fetches from API if needed
 */
export async function getTeacherSchoolId(token, userId) {
  // Check localStorage first
  let schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
  if (schoolId) {
    return schoolId;
  }

  // If not in localStorage, fetch from API
  try {
    console.log("Fetching teacher school from API...");
    const response = await fetch("/api/teacher/school", {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-user-id": userId,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.schoolId) {
        // Save to localStorage for future use
        localStorage.setItem("schoolId", data.schoolId);
        console.log("Teacher schoolId fetched and saved:", data.schoolId);
        return data.schoolId;
      }
    } else if (response.status === 401) {
      // Token expired
      throw new Error("Session expired");
    }
  } catch (error) {
    console.error("Error fetching teacher school:", error);
  }

  return null;
}

/**
 * Verify teacher has access and get required IDs
 */
export async function getTeacherAccessIds(router) {
  const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  if (!token || !userId) {
    router.push("/login");
    return { schoolId: null, userId: null, token: null };
  }

  // Try to get schoolId if missing
  let finalSchoolId = schoolId;
  if (!finalSchoolId) {
    finalSchoolId = await getTeacherSchoolId(token, userId);
  }

  // If still no schoolId, redirect to login or profile setup
  if (!finalSchoolId) {
    console.warn("No school assigned to teacher. Redirecting to dashboard.");
    router.push("/dashboard");
    return { schoolId: null, userId: null, token: null };
  }

  return { schoolId: finalSchoolId, userId, token };
}
