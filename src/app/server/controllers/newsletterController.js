import { Subscriber, Campaign, Template, ActivityLog } from '../models/Newsletter.js';
import { connectDB } from '@/utils/db.js';
import {
  sendEmailViaBrevo,
  sendBulkEmailsViaBrevo,
  createBrevoContact,
  updateBrevoContact,
  deleteBrevoContact,
  verifyBrevoApiKey,
} from '@/app/server/utils/brevoEmailService.js';

// Verify Brevo configuration on startup
if (process.env.BREVO_API_KEY) {
  verifyBrevoApiKey().catch(error => {
    console.log('Brevo configuration notice:', error.message);
  });
}

// ============================================
// SUBSCRIBER MANAGEMENT
// ============================================

export const subscribeToNewsletter = async (subscriberData) => {
  try {
    await connectDB();

    const { email, firstName, lastName, tags = [] } = subscriberData;

    // Check if subscriber already exists
    let subscriber = await Subscriber.findOne({ email });

    if (subscriber) {
      // Reactivate if previously unsubscribed
      if (subscriber.subscriptionStatus === 'inactive') {
        subscriber.subscriptionStatus = 'active';
        subscriber.unsubscribedAt = null;
        subscriber.lastActivityDate = new Date();
      }
    } else {
      // Create new subscriber
      subscriber = new Subscriber({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        tags,
        subscriptionStatus: 'active',
      });
    }

    await subscriber.save();

    // Create/Update contact in Brevo
    try {
      await createBrevoContact({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        listIds: [1], // Default list in Brevo
        attributes: {
          FIRSTNAME: firstName || '',
          LASTNAME: lastName || '',
          TAGS: tags.join(','),
        },
      });
    } catch (brevoError) {
      console.warn('Warning: Could not sync contact with Brevo:', brevoError.message);
      // Don't fail the subscription if Brevo sync fails
    }

    // Send welcome email
    try {
      const emailResult = await sendEmailViaBrevo({
        to: email,
        subject: 'Welcome to Kiddies Check Newsletter',
        htmlContent: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .content { padding: 20px; background: #f9f9f9; border-radius: 8px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                a { color: #667eea; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welcome to Kiddies Check Newsletter!</h1>
                </div>
                <div class="content">
                  <p>Hi ${firstName || 'there'},</p>
                  <p>Thank you for subscribing to our newsletter! We're excited to share the latest updates, insights, and innovations from Kiddies Check.</p>
                  <p>You'll receive:</p>
                  <ul>
                    <li>Latest industry news and trends</li>
                    <li>Product updates and announcements</li>
                    <li>Exclusive insights from our team</li>
                    <li>Special offers and promotions</li>
                  </ul>
                  <p>If you have any questions or feedback, feel free to reach out to us.</p>
                  <p>Best regards,<br/>The Kiddies Check Team</p>
                </div>
                <div class="footer">
                  <p>© 2025 Kiddies Check. All rights reserved.</p>
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?email=${email}">Unsubscribe</a></p>
                </div>
              </div>
            </body>
          </html>
        `,
        textContent: `Welcome to Kiddies Check Newsletter!

Hi ${firstName || 'there'},

Thank you for subscribing to our newsletter! We're excited to share the latest updates, insights, and innovations from Kiddies Check.

You'll receive:
- Latest industry news and trends
- Product updates and announcements
- Exclusive insights from our team
- Special offers and promotions

If you have any questions or feedback, feel free to reach out to us.

Best regards,
The Kiddies Check Team

---
To unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?email=${email}
        `,
        senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@kiddiescheck.org',
        senderName: process.env.BREVO_SENDER_NAME || 'Kiddies Check',
        tags: ['welcome', 'subscription'],
      });
      
      if (!emailResult.success) {
        console.error('❌ Welcome email send failed:', emailResult);
      } else {
        console.log('✓ Welcome email sent to:', email, 'Message ID:', emailResult.messageId);
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError.message, emailError);
      // Don't fail the subscription if email sending fails
    }

    // Log activity
    await ActivityLog.create({
      subscriberId: subscriber._id,
      eventType: 'subscribed',
    });

    return {
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscriber,
    };
  } catch (error) {
    throw new Error(`Subscription error: ${error.message}`);
  }
};

export const unsubscribeFromNewsletter = async (email) => {
  try {
    await connectDB();

    const subscriber = await Subscriber.findOne({ email });

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    subscriber.subscriptionStatus = 'inactive';
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    // Update contact status in Brevo
    try {
      await updateBrevoContact(email, {
        attributes: {
          UNSUBSCRIBED: true,
        },
      });
    } catch (brevoError) {
      console.warn('Warning: Could not update Brevo contact:', brevoError.message);
    }

    // Log activity
    await ActivityLog.create({
      subscriberId: subscriber._id,
      eventType: 'unsubscribed',
    });

    return {
      success: true,
      message: 'Successfully unsubscribed from newsletter',
    };
  } catch (error) {
    throw new Error(`Unsubscription error: ${error.message}`);
  }
};

export const getAllSubscribers = async (filters = {}) => {
  try {
    await connectDB();

    const {
      status = 'active',
      page = 1,
      limit = 20,
      search = '',
      tags = [],
      sortBy = 'subscribedAt',
      sortOrder = -1,
    } = filters;

    const query = {};

    // Filter by status
    if (status) query.subscriptionStatus = status;

    // Search by email or name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by tags
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;

    const subscribers = await Subscriber.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Subscriber.countDocuments(query);

    return {
      success: true,
      subscribers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error fetching subscribers: ${error.message}`);
  }
};

export const getSubscriber = async (email) => {
  try {
    await connectDB();

    const subscriber = await Subscriber.findOne({ email });

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    return {
      success: true,
      subscriber,
    };
  } catch (error) {
    throw new Error(`Error fetching subscriber: ${error.message}`);
  }
};

export const updateSubscriber = async (email, updateData) => {
  try {
    await connectDB();

    const subscriber = await Subscriber.findOneAndUpdate(
      { email },
      { ...updateData, lastActivityDate: new Date() },
      { new: true, runValidators: true }
    );

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    return {
      success: true,
      message: 'Subscriber updated successfully',
      subscriber,
    };
  } catch (error) {
    throw new Error(`Error updating subscriber: ${error.message}`);
  }
};

export const deleteSubscriber = async (email) => {
  try {
    await connectDB();

    const subscriber = await Subscriber.findOneAndDelete({ email });

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    // Delete contact from Brevo
    try {
      await deleteBrevoContact(email);
    } catch (brevoError) {
      console.warn('Warning: Could not delete contact from Brevo:', brevoError.message);
    }

    // Remove associated activity logs
    await ActivityLog.deleteMany({ subscriberId: subscriber._id });

    return {
      success: true,
      message: 'Subscriber deleted successfully',
    };
  } catch (error) {
    throw new Error(`Error deleting subscriber: ${error.message}`);
  }
};

export const adminUnsubscribeSubscriber = async (subscriberId) => {
  try {
    await connectDB();

    const subscriber = await Subscriber.findByIdAndUpdate(
      subscriberId,
      {
        subscriptionStatus: 'inactive',
        unsubscribedAt: new Date(),
      },
      { new: true }
    );

    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    return {
      success: true,
      message: 'Subscriber unsubscribed successfully',
      subscriber,
    };
  } catch (error) {
    throw new Error(`Error unsubscribing subscriber: ${error.message}`);
  }
};

// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

export const createCampaign = async (campaignData, userId) => {
  try {
    await connectDB();

    console.log('📝 Creating campaign with data:', {
      title: campaignData.title,
      subject: campaignData.subject,
      contentLength: campaignData.content?.length,
      htmlContentLength: campaignData.htmlContent?.length,
      contentPreview: campaignData.content?.substring(0, 100),
      htmlContentPreview: campaignData.htmlContent?.substring(0, 100),
    });

    // Only set sender if userId is a valid value (not 'anonymous')
    const campaignPayload = {
      ...campaignData,
    };

    if (userId && userId !== 'anonymous') {
      campaignPayload.sender = userId;
    }

    const campaign = new Campaign(campaignPayload);

    await campaign.save();

    console.log('✓ Campaign saved:', {
      id: campaign._id,
      title: campaign.title,
      contentLength: campaign.content?.length,
      htmlContentLength: campaign.htmlContent?.length,
    });

    return {
      success: true,
      message: 'Campaign created successfully',
      campaign,
    };
  } catch (error) {
    console.error('❌ Error creating campaign:', error.message);
    throw new Error(`Error creating campaign: ${error.message}`);
  }
};

export const sendNewsletter = async (campaignId, userId) => {
  try {
    await connectDB();

    const campaign = await Campaign.findById(campaignId).populate('sender');

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    console.log('📤 Sending campaign:', {
      id: campaign._id,
      title: campaign.title,
      subject: campaign.subject,
      contentLength: campaign.content?.length,
      htmlContentLength: campaign.htmlContent?.length,
      contentPreview: campaign.content?.substring(0, 100),
      htmlContentPreview: campaign.htmlContent?.substring(0, 100),
    });

    if (campaign.status === 'sent') {
      throw new Error('Campaign has already been sent');
    }

    // Get recipients based on type
    let subscribers = [];
    const { type, selectedSegments, selectedTags, selectedSubscribers } = campaign.recipients;

    if (type === 'all') {
      subscribers = await Subscriber.find({ subscriptionStatus: 'active' });
    } else if (type === 'segment') {
      subscribers = await Subscriber.find({
        subscriptionStatus: 'active',
        tags: { $in: selectedSegments },
      });
    } else if (type === 'list') {
      subscribers = await Subscriber.find({
        subscriptionStatus: 'active',
        tags: { $in: selectedTags },
      });
    } else if (type === 'individual') {
      subscribers = await Subscriber.find({
        _id: { $in: selectedSubscribers },
        subscriptionStatus: 'active',
      });
    }

    if (subscribers.length === 0) {
      throw new Error('No active subscribers found for this campaign');
    }

    // Prepare emails for Brevo
    const emailList = subscribers.map(subscriber => {
      const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/unsubscribe?email=${subscriber.email}`;
      const htmlContent = `
        ${campaign.htmlContent || campaign.content}
        <footer style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 12px; color: #666;">
          <p><a href="${unsubscribeLink}">Unsubscribe from this newsletter</a></p>
        </footer>
      `;

      // Create plain text version from campaign subject and a generic message
      const textContent = `
${campaign.subject}

---

To unsubscribe from this newsletter, click the link below:
${unsubscribeLink}
      `.trim();

      return {
        to: subscriber.email,
        subject: campaign.subject,
        htmlContent,
        textContent, // ← THIS WAS MISSING!
        senderEmail: process.env.BREVO_SENDER_EMAIL || campaign.senderEmail,
        senderName: process.env.BREVO_SENDER_NAME || campaign.senderName,
        tags: ['newsletter', campaign.campaignType],
      };
    });

    // Send via Brevo
    const results = await sendBulkEmailsViaBrevo(emailList);

    // Create activity logs for successful sends
    for (const subscriber of subscribers) {
      const success = results.successful.some(s => s.email === subscriber.email);
      if (success) {
        await ActivityLog.create({
          subscriberId: subscriber._id,
          campaignId: campaign._id,
          eventType: 'sent',
          metadata: {
            messageId: results.successful.find(s => s.email === subscriber.email)?.messageId,
          },
        });
      }
    }

    // Update campaign statistics
    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.sentCount = results.totalSent;
    campaign.failedCount = results.totalFailed;
    campaign.analytics = {
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      complaintRate: 0,
      unsubscribeRate: 0,
    };
    await campaign.save();

    return {
      success: true,
      message: `Newsletter sent to ${results.totalSent} subscribers`,
      campaign,
      statistics: {
        sentCount: results.totalSent,
        failedCount: results.totalFailed,
        totalRecipients: subscribers.length,
        errors: results.failed.slice(0, 10),
      },
    };
  } catch (error) {
    throw new Error(`Error sending newsletter: ${error.message}`);
  }
};

export const scheduleCampaign = async (campaignId, scheduledFor, userId) => {
  try {
    await connectDB();

    if (new Date(scheduledFor) <= new Date()) {
      throw new Error('Scheduled time must be in the future');
    }

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      {
        status: 'scheduled',
        scheduledFor: new Date(scheduledFor),
      },
      { new: true }
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      success: true,
      message: 'Campaign scheduled successfully',
      campaign,
    };
  } catch (error) {
    throw new Error(`Error scheduling campaign: ${error.message}`);
  }
};

export const pauseCampaign = async (campaignId) => {
  try {
    await connectDB();

    const campaign = await Campaign.findByIdAndUpdate(
      campaignId,
      { status: 'paused' },
      { new: true }
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      success: true,
      message: 'Campaign paused successfully',
      campaign,
    };
  } catch (error) {
    throw new Error(`Error pausing campaign: ${error.message}`);
  }
};

export const editCampaign = async (campaignId, updateData, userId) => {
  try {
    await connectDB();

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'sent') {
      throw new Error('Cannot edit a campaign that has already been sent');
    }

    // Store edit history
    if (!campaign.editHistory) {
      campaign.editHistory = [];
    }

    campaign.editHistory.push({
      editedAt: new Date(),
      editedBy: userId,
      changes: updateData,
    });

    // Update campaign
    Object.assign(campaign, updateData);
    await campaign.save();

    return {
      success: true,
      message: 'Campaign updated successfully',
      campaign,
    };
  } catch (error) {
    throw new Error(`Error editing campaign: ${error.message}`);
  }
};

export const deleteCampaign = async (campaignId) => {
  try {
    await connectDB();

    const campaign = await Campaign.findByIdAndDelete(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Remove associated activity logs
    await ActivityLog.deleteMany({ campaignId: campaign._id });

    return {
      success: true,
      message: 'Campaign deleted successfully',
    };
  } catch (error) {
    throw new Error(`Error deleting campaign: ${error.message}`);
  }
};

export const getCampaign = async (campaignId) => {
  try {
    await connectDB();

    const campaign = await Campaign.findById(campaignId)
      .populate('sender', 'name email')
      .populate('editHistory.editedBy', 'name email');

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    return {
      success: true,
      campaign,
    };
  } catch (error) {
    throw new Error(`Error fetching campaign: ${error.message}`);
  }
};

export const getAllCampaigns = async (filters = {}) => {
  try {
    await connectDB();

    const {
      status,
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'createdAt',
      sortOrder = -1,
    } = filters;

    const query = {};

    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email')
      .select('-__v');

    const total = await Campaign.countDocuments(query);

    return {
      success: true,
      campaigns,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error fetching campaigns: ${error.message}`);
  }
};

// ============================================
// CAMPAIGN ANALYTICS
// ============================================

export const getCampaignAnalytics = async (campaignId) => {
  try {
    await connectDB();

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Calculate analytics
    const analytics = {
      totalSent: campaign.sentCount,
      opens: campaign.openCount,
      clicks: campaign.clickCount,
      bounces: campaign.bounceCount,
      complaints: campaign.complaintCount,
      unsubscribes: campaign.unsubscribeCount,
      openRate: campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(2) : 0,
      clickRate: campaign.sentCount > 0 ? ((campaign.clickCount / campaign.sentCount) * 100).toFixed(2) : 0,
      bounceRate: campaign.sentCount > 0 ? ((campaign.bounceCount / campaign.sentCount) * 100).toFixed(2) : 0,
      complaintRate: campaign.sentCount > 0 ? ((campaign.complaintCount / campaign.sentCount) * 100).toFixed(2) : 0,
      unsubscribeRate: campaign.sentCount > 0 ? ((campaign.unsubscribeCount / campaign.sentCount) * 100).toFixed(2) : 0,
    };

    // Get activity logs
    const activityLogs = await ActivityLog.find({ campaignId })
      .populate('subscriberId', 'email firstName lastName');

    return {
      success: true,
      analytics,
      activityLogs,
    };
  } catch (error) {
    throw new Error(`Error fetching campaign analytics: ${error.message}`);
  }
};

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

export const createTemplate = async (templateData, userId) => {
  try {
    await connectDB();

    const template = new Template({
      ...templateData,
      createdBy: userId,
    });

    await template.save();

    return {
      success: true,
      message: 'Template created successfully',
      template,
    };
  } catch (error) {
    throw new Error(`Error creating template: ${error.message}`);
  }
};

export const getTemplate = async (templateId) => {
  try {
    await connectDB();

    const template = await Template.findById(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      success: true,
      template,
    };
  } catch (error) {
    throw new Error(`Error fetching template: ${error.message}`);
  }
};

export const getAllTemplates = async (filters = {}) => {
  try {
    await connectDB();

    const { category, page = 1, limit = 20 } = filters;

    const query = {};

    if (category) query.category = category;

    const skip = (page - 1) * limit;

    const templates = await Template.find(query)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'name email');

    const total = await Template.countDocuments(query);

    return {
      success: true,
      templates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(`Error fetching templates: ${error.message}`);
  }
};

export const updateTemplate = async (templateId, updateData) => {
  try {
    await connectDB();

    const template = await Template.findByIdAndUpdate(
      templateId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      success: true,
      message: 'Template updated successfully',
      template,
    };
  } catch (error) {
    throw new Error(`Error updating template: ${error.message}`);
  }
};

export const deleteTemplate = async (templateId) => {
  try {
    await connectDB();

    const template = await Template.findByIdAndDelete(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  } catch (error) {
    throw new Error(`Error deleting template: ${error.message}`);
  }
};

// ============================================
// NEWSLETTER STATISTICS
// ============================================

export const getNewsletterStatistics = async () => {
  try {
    await connectDB();

    const totalSubscribers = await Subscriber.countDocuments({ subscriptionStatus: 'active' });
    const inactiveSubscribers = await Subscriber.countDocuments({ subscriptionStatus: 'inactive' });
    const bouncedSubscribers = await Subscriber.countDocuments({ subscriptionStatus: 'bounced' });
    const totalCampaigns = await Campaign.countDocuments();
    const sentCampaigns = await Campaign.countDocuments({ status: 'sent' });

    const campaigns = await Campaign.find({ status: 'sent' });
    let totalOpens = 0;
    let totalClicks = 0;

    campaigns.forEach(campaign => {
      totalOpens += campaign.openCount;
      totalClicks += campaign.clickCount;
    });

    return {
      success: true,
      statistics: {
        subscribers: {
          total: totalSubscribers,
          inactive: inactiveSubscribers,
          bounced: bouncedSubscribers,
        },
        campaigns: {
          total: totalCampaigns,
          sent: sentCampaigns,
        },
        engagement: {
          totalOpens,
          totalClicks,
        },
      },
    };
  } catch (error) {
    throw new Error(`Error fetching statistics: ${error.message}`);
  }
};

export const getSubscriberTags = async () => {
  try {
    await connectDB();

    const tags = await Subscriber.distinct('tags');

    return {
      success: true,
      tags,
    };
  } catch (error) {
    throw new Error(`Error fetching tags: ${error.message}`);
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkImportSubscribers = async (subscribersData) => {
  try {
    await connectDB();

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const data of subscribersData) {
      try {
        const { email, firstName, lastName, tags } = data;

        let subscriber = await Subscriber.findOne({ email });

        if (!subscriber) {
          subscriber = new Subscriber({
            email,
            firstName,
            lastName,
            tags: tags || [],
            subscriptionStatus: 'active',
          });

          await subscriber.save();

          await ActivityLog.create({
            subscriberId: subscriber._id,
            eventType: 'subscribed',
          });

          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ email, error: 'Already subscribed' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ email: data.email, error: error.message });
      }
    }

    return {
      success: true,
      message: `Bulk import completed. ${results.successful} successful, ${results.failed} failed`,
      results,
    };
  } catch (error) {
    throw new Error(`Error in bulk import: ${error.message}`);
  }
};

export const bulkDeleteSubscribers = async (subscriberIds) => {
  try {
    await connectDB();

    const result = await Subscriber.deleteMany({ _id: { $in: subscriberIds } });

    // Remove associated activity logs
    await ActivityLog.deleteMany({ subscriberId: { $in: subscriberIds } });

    return {
      success: true,
      message: `${result.deletedCount} subscribers deleted successfully`,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    throw new Error(`Error in bulk delete: ${error.message}`);
  }
};

export const bulkUpdateSubscribers = async (subscriberIds, updateData) => {
  try {
    await connectDB();

    const result = await Subscriber.updateMany(
      { _id: { $in: subscriberIds } },
      { ...updateData, lastActivityDate: new Date() }
    );

    return {
      success: true,
      message: `${result.modifiedCount} subscribers updated successfully`,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    throw new Error(`Error in bulk update: ${error.message}`);
  }
};
