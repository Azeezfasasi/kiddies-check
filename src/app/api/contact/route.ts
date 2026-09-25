import type { NextRequest } from "next/server";
import { createContact, getAllContacts } from "../../server/controllers/contactController";

export async function GET(req: NextRequest) {
  // List all contact forms
  return getAllContacts(req);
}

export async function POST(req: NextRequest) {
  // Create a new contact form submission
  return createContact(req);
}
