/**
 * Email Service for KiddiesCheck using Brevo REST API
 * Handles sending transactional emails via Brevo API
 */

import emailTemplates from '../templates/emailTemplates';

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'info@resinbysaidat.com.ng';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'KiddiesCheck';

/**
 * Helper function to send emails via Brevo REST API
 */
const sendEmailViaBrevo = async (toEmail, toName, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: toEmail,
        name: toName,
      },
    ],
    subject: subject,
    htmlContent: htmlContent,
  };

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Brevo API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Send OTP Email
 */
export const sendOtpEmail = async (email, firstName, otp, schoolName) => {
  try {
    const result = await sendEmailViaBrevo(
      email,
      firstName,
      'KiddiesCheck - Email Verification Code (OTP)',
      emailTemplates.registrationOTP(firstName, otp, schoolName)
    );
    console.log('OTP email sent:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw error;
  }
};

/**
 * Send Admin Notification Email - New Registration Pending
 */
export const sendAdminPendingNotification = async (
  adminEmail,
  firstName,
  lastName,
  userEmail,
  schoolName,
  schoolModel,
  location,
  numberOfStudents,
  numberOfTeachers
) => {
  try {
    const result = await sendEmailViaBrevo(
      adminEmail,
      'Admin',
      `[PENDING APPROVAL] New School Registration - ${schoolName}`,
      emailTemplates.adminPendingApproval(
        firstName,
        lastName,
        userEmail,
        schoolName,
        schoolModel,
        location,
        numberOfStudents,
        numberOfTeachers
      )
    );
    console.log('Admin notification email sent:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
};

/**
 * Send Registration Approved Email
 */
export const sendApprovalEmail = async (email, firstName, schoolName) => {
  try {
    const result = await sendEmailViaBrevo(
      email,
      firstName,
      '🎉 Your KiddiesCheck Registration Has Been Approved!',
      emailTemplates.registrationApproved(firstName, schoolName)
    );
    console.log('Approval email sent:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

/**
 * Send Registration Rejected Email
 */
export const sendRejectionEmail = async (email, firstName, schoolName, rejectionReason) => {
  try {
    const result = await sendEmailViaBrevo(
      email,
      firstName,
      'KiddiesCheck Registration Status Update',
      emailTemplates.registrationRejected(firstName, schoolName, rejectionReason)
    );
    console.log('Rejection email sent:', result);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    throw error;
  }
};

/**
 * Verify email service connection
 */
export const verifyEmailConnection = async () => {
  try {
    // Test by checking if API key is configured
    if (!BREVO_API_KEY) {
      console.error('Email service not configured: BREVO_API_KEY missing');
      return false;
    }
    console.log('Email service is ready (using Brevo REST API)');
    return true;
  } catch (error) {
    console.error('Email service verification failed:', error);
    return false;
  }
};

export default {
  sendOtpEmail,
  sendAdminPendingNotification,
  sendApprovalEmail,
  sendRejectionEmail,
  verifyEmailConnection,
};
