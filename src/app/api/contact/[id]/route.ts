import type { NextRequest } from "next/server";
import { deleteContact, replyToContact, getContactById } from "../../../server/controllers/contactController";
import Contact from "@/app/server/models/Contact";
import { authorizeAccess, requireAccess } from "@/app/server/lib/requireAccess";

const CONTACT_STATUSES = ["pending", "replied", "closed"];

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "contact-responses", { level: "view" });
  if (denied) return denied;
  // Get single contact form
  const params = await context.params;
  return getContactById(req, params.id);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "contact-responses");
  if (denied) return denied;
  // Delete contact form
  const params = await context.params;
  return deleteContact(req, params.id);
}

/**
 * PUT /api/contact/[id]
 *   { message }  — reply to the contact form (status becomes "replied")
 *   { status }   — change status only (pending | replied | closed)
 * The reply is attributed to the signed-in user, never to a client-sent id.
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAccess(req, "contact-responses");
  if ("response" in auth) return auth.response;
  const { id } = await context.params;
  const body = await req.json();

  if (body.status && !body.message) {
    if (!CONTACT_STATUSES.includes(body.status)) {
      return Response.json({ success: false, message: "Invalid status" }, { status: 400 });
    }
    const contact = await Contact.findByIdAndUpdate(id, { status: body.status }, { new: true });
    if (!contact) return Response.json({ success: false, message: "Contact not found" }, { status: 404 });
    return Response.json({ success: true, contact }, { status: 200 });
  }

  // Reply: hand the controller the body with the authenticated sender.
  req.json = async () => ({ ...body, senderId: auth.user._id.toString() });
  return replyToContact(req, id);
}
