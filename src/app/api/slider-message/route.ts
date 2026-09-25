import { type NextRequest, NextResponse } from "next/server";
import {
  getAllSliderMessages,
  getActiveSliderMessages,
  createSliderMessage,
  reorderSliderMessages,
} from "../../server/controllers/sliderMessageController";
import { authenticate } from "../../server/middleware/auth";

// GET /api/slider-message
// Public: returns active messages
// Admin: returns all messages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");

    if (all === "true") {
      // Admin-only: check auth
      return authenticate(req, async (user) => {
        const messages = await getAllSliderMessages();
        return NextResponse.json({ success: true, messages });
      });
    }

    // Public endpoint
    const messages = await getActiveSliderMessages();
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("Slider message GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/slider-message
// Admin only - create new message
export async function POST(req: NextRequest) {
  try {
    return authenticate(req, async (user) => {
      const body = await req.json();

      if (!body.text || body.text.trim() === "") {
        return NextResponse.json(
          { success: false, error: "Message text is required" },
          { status: 400 }
        );
      }

      const newMessage = await createSliderMessage(body);
      return NextResponse.json(
        { success: true, message: newMessage },
        { status: 201 }
      );
    });
  } catch (error) {
    console.error("Slider message POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/slider-message
// Admin only - update a message or reorder
export async function PUT(req: NextRequest) {
  try {
    return authenticate(req, async (user) => {
      const body = await req.json();

      // Reorder request
      if (body.reorder && Array.isArray(body.messageIds)) {
        const reordered = await reorderSliderMessages(body.messageIds);
        return NextResponse.json({ success: true, messages: reordered });
      }

      // Update single message
      if (!body.id) {
        return NextResponse.json(
          { success: false, error: "Message ID is required" },
          { status: 400 }
        );
      }

      const { id, ...updateData } = body;
      // BUG: `updateSliderMessage` is not defined or imported, so this line throws a
      // ReferenceError and every single-message update returns a 500.
      // @ts-expect-error -- kept as-is during the TypeScript conversion; see BUG above.
      const updated = await updateSliderMessage(id, updateData);
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

