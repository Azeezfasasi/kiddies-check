import type { NextRequest } from "next/server";
import { updateQuote, deleteQuote, changeQuoteStatus, replyToQuote, assignQuote } from "../../../server/controllers/quoteController";
import { authorizeAccess, requireAccess } from "@/app/server/lib/requireAccess";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "contact-responses", { roles: ["admin", "learning-specialist"] });
  if (denied) return denied;
  const params = await context.params;
  return updateQuote(req, params.id);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "contact-responses", { roles: ["admin", "learning-specialist"] });
  if (denied) return denied;
  const params = await context.params;
  return deleteQuote(req, params.id);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAccess(req, "contact-responses", { roles: ["admin", "learning-specialist"] });
  if ("response" in auth) return auth.response;
  const params = await context.params;
  const body = await req.json();
  // Replies are attributed to the signed-in user, never to a client-sent id.
  if (body.message) body.senderId = auth.user._id.toString();
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
