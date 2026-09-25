import type { NextRequest } from "next/server";
import { createContact, getAllContacts } from "../../server/controllers/contactController";
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET(req: NextRequest) {
  const denied = await requireAccess(req, "contact-responses");
  if (denied) return denied;
  // List all contact forms
  return getAllContacts(req);
}

export async function POST(req: NextRequest) {
  // Create a new contact form submission
  return createContact(req);
}
