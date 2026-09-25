import type { NextRequest } from "next/server";
import { deleteContact, replyToContact, getContactById } from "../../../server/controllers/contactController";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Get single contact form
  const params = await context.params;
  return getContactById(req, params.id);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Delete contact form
  const params = await context.params;
  return deleteContact(req, params.id);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Reply to contact form
  const params = await context.params;
  return replyToContact(req, params.id);
}
