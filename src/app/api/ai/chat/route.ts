import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/server/lib/requireAccess";
import { buildAiScope } from "@/app/server/ai/scope";
import { buildWelcome } from "@/app/server/ai/prompt";
import { runChat, sanitizeHistory } from "@/app/server/ai/chat";

const json = (body: unknown, status = 200) => Response.json(body, { status });

function textResponse(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

/**
 * GET /api/ai/chat?activeSchoolId=
 * Greeting and suggested questions for the signed-in user.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ("response" in auth) return auth.response;
  const scope = await buildAiScope(auth.user, req.nextUrl.searchParams.get("activeSchoolId"));
  return json({ success: true, role: scope.role, roleLabel: scope.roleLabel, school: scope.activeSchool?.name || null, ...buildWelcome(scope) });
}

/**
 * POST /api/ai/chat
 * Body: { messages: [{ role: "user" | "assistant", content }], activeSchoolId? }
 * Returns the assistant's reply as text. The model looks up data through
 * tools filtered to what the signed-in user may see.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ("response" in auth) return auth.response;

  if (!process.env.GROQ_API_KEY) {
    console.error("[AI] GROQ_API_KEY is not configured");
    return json({ error: "The AI assistant is not configured." }, 503);
  }

  let body: { messages?: unknown; activeSchoolId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const history = sanitizeHistory(body.messages);
  if (!history.length || history[history.length - 1].role !== "user") {
    return json({ error: "Send at least one user message." }, 400);
  }

  try {
    const scope = await buildAiScope(auth.user, body.activeSchoolId);
    return textResponse(await runChat(scope, history));
  } catch (error) {
    console.error("[AI] chat error:", error?.message || error);
    return json({ error: "The AI assistant is unavailable right now. Please try again shortly." }, 502);
  }
}
