import { type NextRequest, NextResponse } from 'next/server';
import {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
} from '@/app/server/controllers/teamController';
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET() {
  const result = await getTeamMembers();
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createTeamMember(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create team member' },
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
    const memberId = searchParams.get('id') || body.memberId;

    if (body.reorder && body.memberIds) {
      const result = await reorderTeamMembers(body.memberIds);
      return NextResponse.json(result);
    }

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const result = await updateTeamMember(memberId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update team member' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteTeamMember(memberId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete team member' },
      { status: 400 }
    );
  }
}
