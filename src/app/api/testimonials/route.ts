import { withAudit } from "@/app/server/lib/audit";
import { type NextRequest, NextResponse } from 'next/server';
import {
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
} from '@/app/server/controllers/testimonialController';
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET() {
  const result = await getTestimonials();
  return NextResponse.json(result);
}

async function postHandler(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const body = await request.json();
    const result = await createTestimonial(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create testimonial' },
      { status: 400 }
    );
  }
}

async function putHandler(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const body = await request.json();

    if (body.reorder && body.testimonialIds) {
      const result = await reorderTestimonials(body.testimonialIds);
      return NextResponse.json(result);
    }

    if (!body.testimonialId) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    const result = await updateTestimonial(body.testimonialId, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial' },
      { status: 400 }
    );
  }
}

async function deleteHandler(request: NextRequest) {
  const denied = await requireAccess(request, "site-content");
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const testimonialId = searchParams.get('id');

    if (!testimonialId) {
      return NextResponse.json(
        { success: false, error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteTestimonial(testimonialId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete testimonial' },
      { status: 400 }
    );
  }
}

export const POST = withAudit(postHandler);
export const PUT = withAudit(putHandler);
export const DELETE = withAudit(deleteHandler);
