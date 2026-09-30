import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { createContact, getAllContacts } from "../../server/controllers/contactController";
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET(req: NextRequest) {
  const denied = await requireAccess(req, "contact-responses", { level: "view" });
  if (denied) return denied;
  // List all contact forms
  return getAllContacts(req);
}

async function postHandler(req: NextRequest) {
  // Create a new contact form submission
  return createContact(req);
}

export const POST = withAudit(postHandler);
