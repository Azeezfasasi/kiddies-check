import { type NextRequest, NextResponse } from 'next/server';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  reorderMilestones,
} from '@/app/server/controllers/milestoneController';
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET() {
  const result = await getMilestones();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createMilestone(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create milestone' },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('id') || body.milestoneId;

    if (body.reorder && body.milestoneIds) {
      const result = await reorderMilestones(body.milestoneIds);
      return NextResponse.json(result);
    }

    if (!milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    const result = await updateMilestone(milestoneId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update milestone' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('id');

    if (!milestoneId) {
      return NextResponse.json(
        { success: false, error: 'Milestone ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteMilestone(milestoneId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete milestone' },
      { status: 400 }
    );
  }
}
