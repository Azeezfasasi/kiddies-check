import { NextRequest, NextResponse } from 'next/server';
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getAllSubscribers,
  getSubscriber,
  updateSubscriber,
  deleteSubscriber,
  createCampaign,
  sendNewsletter,
  scheduleCampaign,
  editCampaign,
  deleteCampaign,
  getAllCampaigns,
  getCampaignAnalytics,
  createTemplate,
  getAllTemplates,
  getNewsletterStatistics,
  bulkImportSubscribers,
  bulkDeleteSubscribers,
  bulkUpdateSubscribers,
} from '@/app/server/controllers/newsletterController.js';

// Middleware to check admin role
const requireAdmin = (req) => {
  // This should be implemented with your auth system
  // For now, we'll check for admin role in session/JWT
  const adminRole = req.headers.get('x-user-role');
  if (adminRole !== 'admin') {
    return false;
  }
  return true;
};

// Get user ID from request (adjust based on your auth system)
const getUserId = (req) => {
  return req.headers.get('x-user-id') || 'anonymous';
};

// ============================================
// SUBSCRIBER ENDPOINTS
// ============================================

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const action = url.searchParams.get('action');

    // GET /api/newsletter?action=subscribers
    if (action === 'subscribers') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search') || '';
      const tags = url.searchParams.getAll('tags');
      const sortBy = url.searchParams.get('sortBy') || 'subscribedAt';

      const result = await getAllSubscribers({
        status,
        page,
        limit,
        search,
        tags,
        sortBy,
      });

      return NextResponse.json(result);
    }

    // GET /api/newsletter?action=subscriber&email=user@example.com
    if (action === 'subscriber') {
      const email = url.searchParams.get('email');

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email parameter required' },
          { status: 400 }
        );
      }

      const result = await getSubscriber(email);
      return NextResponse.json(result);
    }

    // GET /api/newsletter?action=campaigns
    if (action === 'campaigns') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search') || '';

      const result = await getAllCampaigns({
        status,
        page,
        limit,
        search,
      });

      return NextResponse.json(result);
    }

    // GET /api/newsletter?action=statistics
    if (action === 'statistics') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await getNewsletterStatistics();
      return NextResponse.json(result);
    }

    // GET /api/newsletter?action=templates
    if (action === 'templates') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const page = parseInt(url.searchParams.get('page')) || 1;
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      const category = url.searchParams.get('category');

      const result = await getAllTemplates({
        page,
        limit,
        category,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Newsletter GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    // POST /api/newsletter?action=subscribe
    if (action === 'subscribe') {
      const result = await subscribeToNewsletter(body);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=unsubscribe
    if (action === 'unsubscribe') {
      const { email } = body;

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email required' },
          { status: 400 }
        );
      }

      const result = await unsubscribeFromNewsletter(email);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=create-campaign
    if (action === 'create-campaign') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userId = getUserId(request);
      const result = await createCampaign(body, userId);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=send-campaign
    if (action === 'send-campaign') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { campaignId } = body;

      if (!campaignId) {
        return NextResponse.json(
          { success: false, error: 'Campaign ID required' },
          { status: 400 }
        );
      }

      const userId = getUserId(request);
      const result = await sendNewsletter(campaignId, userId);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=schedule-campaign
    if (action === 'schedule-campaign') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { campaignId, scheduledFor } = body;

      if (!campaignId || !scheduledFor) {
        return NextResponse.json(
          { success: false, error: 'Campaign ID and scheduled time required' },
          { status: 400 }
        );
      }

      const userId = getUserId(request);
      const result = await scheduleCampaign(campaignId, scheduledFor, userId);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=create-template
    if (action === 'create-template') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userId = getUserId(request);
      const result = await createTemplate(body, userId);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=bulk-import
    if (action === 'bulk-import') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { subscribers } = body;

      if (!Array.isArray(subscribers)) {
        return NextResponse.json(
          { success: false, error: 'Subscribers must be an array' },
          { status: 400 }
        );
      }

      const result = await bulkImportSubscribers(subscribers);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=bulk-update
    if (action === 'bulk-update') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { subscriberIds, updateData } = body;

      if (!Array.isArray(subscriberIds)) {
        return NextResponse.json(
          { success: false, error: 'Subscriber IDs must be an array' },
          { status: 400 }
        );
      }

      const result = await bulkUpdateSubscribers(subscriberIds, updateData);
      return NextResponse.json(result);
    }

    // POST /api/newsletter?action=bulk-delete
    if (action === 'bulk-delete') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { subscriberIds } = body;

      if (!Array.isArray(subscriberIds)) {
        return NextResponse.json(
          { success: false, error: 'Subscriber IDs must be an array' },
          { status: 400 }
        );
      }

      const result = await bulkDeleteSubscribers(subscriberIds);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Newsletter POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    // PUT /api/newsletter?action=update-subscriber
    if (action === 'update-subscriber') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { email, updateData } = body;

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email required' },
          { status: 400 }
        );
      }

      const result = await updateSubscriber(email, updateData);
      return NextResponse.json(result);
    }

    // PUT /api/newsletter?action=edit-campaign
    if (action === 'edit-campaign') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { campaignId, updateData } = body;

      if (!campaignId) {
        return NextResponse.json(
          { success: false, error: 'Campaign ID required' },
          { status: 400 }
        );
      }

      const userId = getUserId(request);
      const result = await editCampaign(campaignId, updateData, userId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Newsletter PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    // DELETE /api/newsletter?action=delete-subscriber
    if (action === 'delete-subscriber') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { email } = body;

      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email required' },
          { status: 400 }
        );
      }

      const result = await deleteSubscriber(email);
      return NextResponse.json(result);
    }

    // DELETE /api/newsletter?action=delete-campaign
    if (action === 'delete-campaign') {
      if (!requireAdmin(request)) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const { campaignId } = body;

      if (!campaignId) {
        return NextResponse.json(
          { success: false, error: 'Campaign ID required' },
          { status: 400 }
        );
      }

      const result = await deleteCampaign(campaignId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Newsletter DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
