/**
 * Brevo Email Service
 * Integration with Brevo (SendinBlue) for email sending
 */

const brevoApiKey = process.env.BREVO_API_KEY;
const brevoApiUrl = 'https://api.brevo.com/v3';

/**
 * Send email via Brevo API
 * @param {Object} emailData - Email configuration
 * @returns {Promise<Object>} Response from Brevo API
 */
export const sendEmailViaBrevo = async (emailData) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const {
      to,
      subject,
      htmlContent,
      textContent,
      senderEmail = process.env.BREVO_SENDER_EMAIL,
      senderName = process.env.BREVO_SENDER_NAME,
      cc = [],
      bcc = [],
      replyTo = null,
      tags = [],
      templateId = null,
      params = {},
      attachment = null,
    } = emailData;

    console.log('📧 Sending email via Brevo:', {
      to,
      subject,
      senderEmail,
      senderName,
    });

    // If using a template
    if (templateId) {
      const response = await fetch(`${brevoApiUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          params,
          tags,
          cc: cc.length > 0 ? cc.map(email => ({ email })) : undefined,
          bcc: bcc.length > 0 ? bcc.map(email => ({ email })) : undefined,
          replyTo: replyTo ? { email: replyTo } : undefined,
        }),
      });

      return handleBrevoResponse(response);
    }

    // Regular email with content
    const emailPayload = {
      to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
      sender: {
        email: senderEmail,
        name: senderName,
      },
      subject,
      htmlContent: htmlContent || '',
      textContent: textContent || subject, // ← Fallback to subject if textContent is empty (required by Brevo)
      tags: tags || [],
    };

    // Add optional fields
    if (cc.length > 0) {
      emailPayload.cc = cc.map(email => ({ email }));
    }

    if (bcc.length > 0) {
      emailPayload.bcc = bcc.map(email => ({ email }));
    }

    if (replyTo) {
      emailPayload.replyTo = { email: replyTo };
    }

    // Add attachment if provided
    if (attachment) {
      emailPayload.attachment = [
        {
          url: attachment.url,
          name: attachment.name,
        },
      ];
    }

    console.log('📤 Brevo API Payload:', JSON.stringify(emailPayload, null, 2));

    const response = await fetch(`${brevoApiUrl}/smtp/email`, {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('❌ Brevo email send error:', error);
    throw new Error(`Failed to send email via Brevo: ${error.message}`);
  }
};

/**
 * Send bulk emails via Brevo
 * @param {Array<Object>} emailList - Array of email data objects
 * @returns {Promise<Object>} Results of bulk send
 */
export const sendBulkEmailsViaBrevo = async (emailList) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const results = {
      successful: [],
      failed: [],
      totalSent: 0,
      totalFailed: 0,
    };

    for (const emailData of emailList) {
      try {
        const result = await sendEmailViaBrevo(emailData);
        if (result.success) {
          results.successful.push({
            email: emailData.to,
            messageId: result.messageId,
          });
          results.totalSent++;
        } else {
          results.failed.push({
            email: emailData.to,
            error: result.error,
          });
          results.totalFailed++;
        }
      } catch (error) {
        results.failed.push({
          email: emailData.to,
          error: error.message,
        });
        results.totalFailed++;
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return results;
  } catch (error) {
    console.error('Brevo bulk send error:', error);
    throw error;
  }
};

/**
 * Create a contact in Brevo
 * @param {Object} contactData - Contact information
 * @returns {Promise<Object>} Response from Brevo API
 */
export const createBrevoContact = async (contactData) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const { email, firstName, lastName, listIds = [], attributes = {} } = contactData;

    const payload = {
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      listIds: listIds && listIds.length > 0 ? listIds : [1], // 1 is default list
      attributes: {
        FIRSTNAME: firstName || '',
        LASTNAME: lastName || '',
        ...attributes,
      },
    };

    const response = await fetch(`${brevoApiUrl}/contacts`, {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo contact creation error:', error);
    throw error;
  }
};

/**
 * Update a contact in Brevo
 * @param {string} email - Contact email
 * @param {Object} updateData - Updated contact information
 * @returns {Promise<Object>} Response from Brevo API
 */
export const updateBrevoContact = async (email, updateData) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const { listIds = [], attributes = {} } = updateData;

    const payload = {
      listIds: listIds && listIds.length > 0 ? listIds : undefined,
      attributes: {
        ...attributes,
      },
    };

    const response = await fetch(`${brevoApiUrl}/contacts/${encodeURIComponent(email)}`, {
      method: 'PUT',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo contact update error:', error);
    throw error;
  }
};

/**
 * Add contact to a list in Brevo
 * @param {number} listId - Brevo list ID
 * @param {Array<Object>} contacts - Contacts to add
 * @returns {Promise<Object>} Response from Brevo API
 */
export const addContactsToList = async (listId, contacts) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const payload = {
      emails: contacts.map(c => c.email),
    };

    const response = await fetch(`${brevoApiUrl}/contacts/lists/${listId}/contacts/add`, {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo add to list error:', error);
    throw error;
  }
};

/**
 * Remove contact from a list in Brevo
 * @param {number} listId - Brevo list ID
 * @param {Array<string>} emails - Email addresses to remove
 * @returns {Promise<Object>} Response from Brevo API
 */
export const removeContactsFromList = async (listId, emails) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const payload = {
      emails,
    };

    const response = await fetch(`${brevoApiUrl}/contacts/lists/${listId}/contacts/remove`, {
      method: 'POST',
      headers: {
        'api-key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo remove from list error:', error);
    throw error;
  }
};

/**
 * Get contact from Brevo
 * @param {string} email - Contact email
 * @returns {Promise<Object>} Contact information
 */
export const getBrevoContact = async (email) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const response = await fetch(`${brevoApiUrl}/contacts/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
      },
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo get contact error:', error);
    throw error;
  }
};

/**
 * Delete contact from Brevo
 * @param {string} email - Contact email
 * @returns {Promise<Object>} Response from Brevo API
 */
export const deleteBrevoContact = async (email) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const response = await fetch(`${brevoApiUrl}/contacts/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'api-key': brevoApiKey,
      },
    });

    if (response.status === 204) {
      return { success: true, message: 'Contact deleted successfully' };
    }

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo delete contact error:', error);
    throw error;
  }
};

/**
 * Get email event logs from Brevo
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Email events
 */
export const getEmailEvents = async (filters = {}) => {
  try {
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY is not configured');
    }

    const {
      limit = 50,
      offset = 0,
      event = null,
      email = null,
      startDate = null,
      endDate = null,
    } = filters;

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (event) params.append('event', event);
    if (email) params.append('email', email);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`${brevoApiUrl}/smtp/log?${params}`, {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
      },
    });

    return handleBrevoResponse(response);
  } catch (error) {
    console.error('Brevo get events error:', error);
    throw error;
  }
};

/**
 * Handle Brevo API responses
 * @param {Response} response - Fetch response object
 * @returns {Promise<Object>} Parsed response
 */
async function handleBrevoResponse(response) {
  try {
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API Error:', {
        status: response.status,
        message: data.message || data.error,
        details: data,
      });
      return {
        success: false,
        status: response.status,
        error: data.message || data.error || 'Unknown error from Brevo API',
        details: data,
      };
    }

    console.log('✓ Brevo API Success:', {
      status: response.status,
      messageId: data.messageId,
    });

    return {
      success: true,
      status: response.status,
      messageId: data.messageId || null,
      data,
    };
  } catch (error) {
    console.error('❌ Brevo Response Parse Error:', error);
    return {
      success: false,
      status: response.status,
      error: 'Failed to parse Brevo API response',
      details: error.message,
    };
  }
}

/**
 * Verify Brevo API key
 * @returns {Promise<boolean>} True if API key is valid
 */
export const verifyBrevoApiKey = async () => {
  try {
    if (!brevoApiKey) {
      console.error('BREVO_API_KEY is not configured');
      return false;
    }

    const response = await fetch(`${brevoApiUrl}/account`, {
      method: 'GET',
      headers: {
        'api-key': brevoApiKey,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✓ Brevo API Key verified successfully');
      console.log(`Account: ${data.email}, Plan: ${data.plan}`);
      return true;
    }

    console.error('✗ Brevo API Key verification failed:', response.status);
    return false;
  } catch (error) {
    console.error('Error verifying Brevo API Key:', error);
    return false;
  }
};
