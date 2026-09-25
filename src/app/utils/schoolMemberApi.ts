/**
 * Client-side utilities for school member operations
 */

/**
 * Invite a member to the school
 */
export async function inviteSchoolMember(schoolId, email, role, permissions = []) {
  const response = await fetch('/api/school/invite-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schoolId,
      email,
      role,
      permissions,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite member');
  }

  return response.json();
}

/**
 * Fetch school members
 */
export async function fetchSchoolMembers(schoolId, status = 'active', page = 1, limit = 10) {
  const response = await fetch(
    `/api/school/invite-member?schoolId=${schoolId}&status=${status}&page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch members');
  }

  return response.json();
}

/**
 * Update a member
 */
export async function updateSchoolMember(memberId, updates) {
  const response = await fetch(`/api/school/members/${memberId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update member');
  }

  return response.json();
}

/**
 * Remove a member
 */
export async function removeSchoolMember(memberId) {
  const response = await fetch(`/api/school/members/${memberId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove member');
  }

  return response.json();
}
