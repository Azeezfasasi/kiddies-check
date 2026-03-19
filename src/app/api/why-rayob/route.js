import {
  getWhyRayobContent,
  updateWhyRayobHeading,
  createReason,
  updateReason,
  deleteReason,
  reorderReasons,
  updateCTAContent,
} from "../../server/controllers/whyRayobController";

// GET all content
export async function GET() {
  try {
    const content = await getWhyRayobContent();
    return Response.json({ success: true, data: content });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST new reason
export async function POST(req) {
  try {
    const body = await req.json();

    if (body.action === "create-reason") {
      if (!body.title || !body.description || !body.icon) {
        return Response.json(
          { success: false, error: "Missing required fields" },
          { status: 400 }
        );
      }

      const reason = await createReason(body);
      return Response.json({ success: true, reason }, { status: 201 });
    }

    if (body.action === "update-heading") {
      const content = await updateWhyRayobHeading(body);
      return Response.json({ success: true, data: content });
    }

    if (body.action === "update-cta") {
      const content = await updateCTAContent(body);
      return Response.json({ success: true, data: content });
    }

    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT for updating
export async function PUT(req) {
  try {
    const body = await req.json();

    if (body.action === "update-reason") {
      const reason = await updateReason(body.reasonId, body.data);
      return Response.json({ success: true, reason });
    }

    if (body.action === "reorder") {
      const reasons = await reorderReasons(body.reasons);
      return Response.json({ success: true, reasons });
    }

    return Response.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE reason
export async function DELETE(req) {
  try {
    const body = await req.json();
    const reasonId = body.reasonId;

    if (!reasonId) {
      return Response.json(
        { success: false, error: "Reason ID is required" },
        { status: 400 }
      );
    }

    await deleteReason(reasonId);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
