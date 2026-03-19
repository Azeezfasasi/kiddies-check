import { updateQuote, deleteQuote, changeQuoteStatus, replyToQuote, assignQuote } from "../../../server/controllers/quoteController";

export async function PATCH(req, context) {
  const params = await context.params;
  return updateQuote(req, params.id);
}

export async function DELETE(req, context) {
  const params = await context.params;
  return deleteQuote(req, params.id);
}

export async function PUT(req, context) {
  const params = await context.params;
  const body = await req.json();
  if (body.status) {
    req.json = async () => body;
    return changeQuoteStatus(req, params.id);
  } else if (body.message && body.senderId) {
    req.json = async () => body;
    return replyToQuote(req, params.id);
  } else if (body.assignedTo) {
    req.json = async () => body;
    return assignQuote(req, params.id);
  }
  return new Response(JSON.stringify({ success: false, message: "Invalid request" }), { status: 400 });
}
