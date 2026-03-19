import { deleteContact, replyToContact, getContactById } from "../../../server/controllers/contactController";

export async function GET(req, context) {
  // Get single contact form
  const params = await context.params;
  return getContactById(req, params.id);
}

export async function DELETE(req, context) {
  // Delete contact form
  const params = await context.params;
  return deleteContact(req, params.id);
}

export async function PUT(req, context) {
  // Reply to contact form
  const params = await context.params;
  return replyToContact(req, params.id);
}
