import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriber,
  updateSubscriber,
  deleteSubscriber,
  adminUnsubscribeSubscriber,
  getCampaign,
  getCampaignAnalytics,
  editCampaign,
  deleteCampaign,
  pauseCampaign,
} from '@/app/server/controllers/newsletterController';
import { requireAccess } from "@/app/server/lib/requireAccess";

// Newsletter management: a signed-in admin / learning specialist, or a
// platform role granted the newsletter feature. (Previously this trusted an
// x-user-role header sent by the browser.)
const requireAdmin = async (req, level: "view" | "edit" = "edit") => (await requireAccess(req, "newsletter", { level })) === null;

const getUserId = (req) => {
  return req.headers.get('x-user-id') || 'anonymous';
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'campaign';
    const action = url.searchParams.get('action');

    // GET /api/newsletter/[id]?type=campaign&action=analytics
    if (type === 'campaign' && action === 'analytics') {
      if (!(await requireAdmin(request, "view"))) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await getCampaignAnalytics(id);
      return NextResponse.json(result);
    }

    // GET /api/newsletter/[id]?type=campaign
    if (type === 'campaign') {
      if (!(await requireAdmin(request, "view"))) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await getCampaign(id);
      return NextResponse.json(result);
    }

    // GET /api/newsletter/[id]?type=subscriber
    if (type === 'subscriber') {
      // Allow subscribers to view their own data
      const result = await getSubscriber(id);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'campaign';
    const action = url.searchParams.get('action');
    const body = await request.json();

    // PUT /api/newsletter/[id]?type=subscriber
    if (type === 'subscriber') {
      if (!(await requireAdmin(request))) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const result = await updateSubscriber(id, body);
      return NextResponse.json(result);
    }

    // PUT /api/newsletter/[id]?type=campaign
    if (type === 'campaign') {
      if (!(await requireAdmin(request))) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userId = getUserId(request);

      // PUT /api/newsletter/[id]?type=campaign&action=pause
      if (action === 'pause') {
        const result = await pauseCampaign(id);
        return NextResponse.json(result);
      }

      // PUT /api/newsletter/[id]?type=campaign (edit campaign)
      const result = await editCampaign(id, body, userId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'campaign';

    if (!(await requireAdmin(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // DELETE /api/newsletter/[id]?type=subscriber
    if (type === 'subscriber') {
      const result = await deleteSubscriber(id);
      return NextResponse.json(result);
    }

    // DELETE /api/newsletter/[id]?type=campaign
    if (type === 'campaign') {
      const result = await deleteCampaign(id);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
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
