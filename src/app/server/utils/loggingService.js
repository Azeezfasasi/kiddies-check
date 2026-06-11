/**
 * Logging Utility for KiddiesCheck
 * Helper functions to log activities, logins, and issues
 */

/**
 * Log user login
 */
export const logUserLogin = async (userId, email, userName, userRole, schoolId, schoolName, status = 'success', failureReason = null) => {
  try {
    // Get device information
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const deviceType = getDeviceType(userAgent);

    // Get IP address from server-side (if available)
    const response = await fetch('/api/logs/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        email,
        firstName: userName.split(' ')[0],
        lastName: userName.split(' ')[1] || '',
        userRole,
        school: schoolId,
        schoolName,
        status,
        failureReason,
        userAgent,
        deviceType,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to log login:', await response.json());
    }
  } catch (error) {
    console.error('Error logging login:', error);
  }
};

/**
 * Log activity/change
 */
export const logActivity = async (
  userId,
  action,
  entityType,
  entityId,
  entityName,
  description,
  changes = null,
  status = 'success',
  errorMessage = null
) => {
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        action,
        entityType,
        entityId,
        entityName,
        description,
        changes,
        status,
        errorMessage,
      }),
    });

    if (!response.ok) {
      console.warn('Failed to log activity:', await response.json());
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

/**
 * Report an issue
 */
export const reportIssue = async (
  userId,
  title,
  description,
  category,
  severity = 'medium',
  attachments = []
) => {
  try {
    const response = await fetch('/api/logs/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        title,
        description,
        category,
        severity,
        attachments,
        environmentInfo: {
          userAgent: navigator.userAgent,
          screenResolution: `${window.innerWidth}x${window.innerHeight}`,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to report issue');
    }

    return await response.json();
  } catch (error) {
    console.error('Error reporting issue:', error);
    throw error;
  }
};

/**
 * Get device type from user agent
 */
function getDeviceType(userAgent) {
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

export default {
  logUserLogin,
  logActivity,
  reportIssue,
};
