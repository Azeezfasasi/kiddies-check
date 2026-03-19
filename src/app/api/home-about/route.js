import {
  getHomeAbout,
  updateHomeAbout,
  addParagraph,
  updateParagraph,
  deleteParagraph,
} from "../../server/controllers/homeAboutController";

// GET HomeAbout content
export async function GET() {
  try {
    const homeAbout = await getHomeAbout();
    return Response.json({ success: true, data: homeAbout });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update main content or handle paragraph operations
export async function PUT(req) {
  try {
    const body = await req.json();

    // Handle paragraph operations
    if (body.action === "addParagraph") {
      const paragraph = await addParagraph(body.text);
      return Response.json({ success: true, paragraph });
    }

    if (body.action === "updateParagraph") {
      const paragraph = await updateParagraph(body.paragraphId, body.text);
      return Response.json({ success: true, paragraph });
    }

    if (body.action === "deleteParagraph") {
      const result = await deleteParagraph(body.paragraphId);
      return Response.json({ success: true, ...result });
    }

    // Handle main content update
    const updatedData = await updateHomeAbout(body);
    return Response.json({ success: true, data: updatedData });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
