import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { createQuote, getAllQuotes } from "../../server/controllers/quoteController";
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET(req: NextRequest) {
  const denied = await requireAccess(req, "contact-responses", { roles: ["admin", "learning-specialist"], level: "view" });
  if (denied) return denied;
  // List all quote requests
  return getAllQuotes(req);
}

async function postHandler(req: NextRequest) {
  // Create a new quote request
  return createQuote(req);
}

export const POST = withAudit(postHandler);
