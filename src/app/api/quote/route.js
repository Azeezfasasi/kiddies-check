import { createQuote, getAllQuotes } from "../../server/controllers/quoteController";

export async function GET(req) {
  // List all quote requests
  return getAllQuotes(req);
}

export async function POST(req) {
  // Create a new quote request
  return createQuote(req);
}
