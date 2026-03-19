import { createContact, getAllContacts } from "../../server/controllers/contactController";

export async function GET(req) {
  // List all contact forms
  return getAllContacts(req);
}

export async function POST(req) {
  // Create a new contact form submission
  return createContact(req);
}
