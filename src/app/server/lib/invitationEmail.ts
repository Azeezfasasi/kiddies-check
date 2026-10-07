/**
 * School invitation emails, shared by the invite and resend-invite routes.
 */

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'info@kiddiescheck.org';
const SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Kiddies Check Team';

// Helper function to send emails via Brevo
export const sendEmailViaBrevo = async (toEmail, subject, htmlContent) => {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  const payload = {
    sender: {
      name: SENDER_NAME,
      email: SENDER_EMAIL,
    },
    to: [
      {
        email: toEmail,
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
      console.error('Brevo API error:', errorData);
      throw new Error(`Email service error: ${errorData.message || 'Failed to send email'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email via Brevo:', error.message);
    throw error;
  }
};

/**
 * Helper function to generate invitation email HTML
 */
export function generateInvitationEmail(schoolName, role, link, invitationType) {
  const actionText =
    invitationType === 'new-user' ? 'Set Up Your Account' : 'Access Dashboard';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(to right, #3b82f6, #9333ea); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Welcome to Kiddies Check!</h2>
      </div>
      
      <div style="padding: 20px; background: #f9fafb;">
        <p>Hello,</p>
        
        <p>You've been invited to join <strong>${schoolName}</strong> as a <strong>${role.replace('-', ' ')}</strong>.</p>
        
        ${
          invitationType === 'new-user'
            ? '<p>Please click the button below to create your account and get started:</p>'
            : '<p>You can now access the school dashboard:</p>'
        }
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${actionText}
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br/>
          <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 3px;">${link}</code>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px;">
          If you did not expect this invitation, please contact your school administrator.
        </p>
      </div>
    </div>
  `;
}

/** The link in the email: registration for a new account, the dashboard for an existing one. */
export function invitationLink(invitationType: string, invitationToken: string | null, schoolId: string, email: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  return invitationType === 'new-user'
    ? `${baseUrl}/register?invitationToken=${invitationToken}&schoolId=${schoolId}&email=${encodeURIComponent(email)}`
    : `${baseUrl}/dashboard`;
}
