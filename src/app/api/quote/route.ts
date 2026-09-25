import type { NextRequest } from "next/server";
import { createQuote, getAllQuotes } from "../../server/controllers/quoteController";

export async function GET(req: NextRequest) {
  // List all quote requests
  return getAllQuotes(req);
}

export async function POST(req: NextRequest) {
  // Create a new quote request
  return createQuote(req);
}
