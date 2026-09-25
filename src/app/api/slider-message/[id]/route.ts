import { type NextRequest, NextResponse } from "next/server";
import {
  updateSliderMessage,
  deleteSliderMessage,
} from "../../../server/controllers/sliderMessageController";
import { authenticate } from "../../../server/middleware/auth";
import { requireAccess } from "@/app/server/lib/requireAccess";

// PUT /api/slider-message/[id]
// Admin only - update a specific message
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "site-content");
  if (denied) return denied;
  try {
    return authenticate(req, async (user) => {
      const { id } = await params;
      const body = await req.json();

      const updated = await updateSliderMessage(id, body);
      return NextResponse.json({ success: true, message: updated });
    });
  } catch (error) {
    console.error("Slider message PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/slider-message/[id]
// Admin only - delete a specific message
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "site-content");
  if (denied) return denied;
  try {
    return authenticate(req, async (user) => {
      const { id } = await params;

      const result = await deleteSliderMessage(id);
      return NextResponse.json({ success: true, ...result });
    });
  } catch (error) {
    console.error("Slider message DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

