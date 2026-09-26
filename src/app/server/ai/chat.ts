import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { AiScope } from "@/app/server/ai/scope";
import { AI_TOOLS, type AiTool } from "@/app/server/ai/tools";
import { ADMIN_QUERY_TOOL } from "@/app/server/ai/adminQuery";
import { buildSystemPrompt } from "@/app/server/ai/prompt";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const MAX_TOOL_ROUNDS = 6;
const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOOL_RESULT_CHARS = 12000;

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function availableTools(scope: AiScope): AiTool[] {
  return [...AI_TOOLS, ADMIN_QUERY_TOOL].filter((t) => t.available(scope));
}

/**
 * Only plain user/assistant turns from the browser are accepted; the system
 * prompt and tool results are always produced on the server.
 */
export function sanitizeHistory(messages: unknown): ChatTurn[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
}

async function runTool(scope: AiScope, tools: AiTool[], name: string, rawArgs: string, trace?: string[]): Promise<string> {
  const tool = tools.find((t) => t.name === name);
  if (!tool) return JSON.stringify({ error: `Tool "${name}" is not available to this user.` });
  let args = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    return JSON.stringify({ error: "Invalid tool arguments." });
  }
  try {
    const started = Date.now();
    const result = await tool.run(scope, args);
    console.log(`[AI] ${scope.role} -> ${name} (${Date.now() - started}ms)`);
    trace?.push(`${name}(${rawArgs || "{}"})`);
    const text = JSON.stringify(result ?? null);
    return text.length > MAX_TOOL_RESULT_CHARS ? `${text.slice(0, MAX_TOOL_RESULT_CHARS)}… [truncated; ask a narrower question]` : text;
  } catch (error) {
    console.error(`[AI] tool ${name} failed:`, error);
    trace?.push(`${name} FAILED`);
    return JSON.stringify({ error: "The data lookup failed. Try rephrasing or narrowing the question." });
  }
}

// The model occasionally emits a malformed tool call, which Groq rejects with
// a 400 ("failed_generation" / "tool_use_failed"). Retrying is the standard
// remedy; other errors are passed straight through.
const GENERATION_RETRIES = 2;
async function withGenerationRetry<T>(call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      const text = `${error?.message || ""} ${error?.error?.code || ""}`;
      const retryable = error?.status === 400 && /failed_generation|tool_use_failed|could not be parsed/i.test(text);
      if (!retryable || attempt >= GENERATION_RETRIES) throw error;
      console.warn(`[AI] malformed generation, retrying (${attempt + 1}/${GENERATION_RETRIES})`);
    }
  }
}

/**
 * Runs one assistant turn: the model may call permission-filtered tools
 * (several rounds) before answering. Returns the reply text.
 * `trace`, when given, collects the tool calls made (for diagnostics).
 */
export async function runChat(scope: AiScope, history: ChatTurn[], trace?: string[]): Promise<string> {
  const tools = availableTools(scope);
  const toolDefs: ChatCompletionTool[] = tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));

  const client = new OpenAI({ apiKey: (process.env.GROQ_API_KEY || "").trim(), baseURL: "https://api.groq.com/openai/v1" });
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(scope, tools.map((t) => t.name)) },
    ...history,
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const completion = await withGenerationRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages,
        tools: toolDefs.length ? toolDefs : undefined,
        tool_choice: toolDefs.length ? "auto" : undefined,
        temperature: 0.4,
        max_tokens: 1500,
        // gpt-oss models reason before answering; "low" keeps lookups quick.
        reasoning_effort: "low",
      })
    );
    const message = completion.choices[0]?.message;
    if (!message) break;

    const calls = message.tool_calls?.filter((c) => c.type === "function") || [];
    if (!calls.length) {
      return message.content?.trim() || "I couldn't put together an answer for that. Could you rephrase it?";
    }

    messages.push({ role: "assistant", content: message.content || "", tool_calls: calls });
    for (const call of calls) {
      messages.push({ role: "tool", tool_call_id: call.id, content: await runTool(scope, tools, call.function.name, call.function.arguments, trace) });
    }
  }

  // Too many lookups: ask for a final answer from what was gathered.
  const final = await withGenerationRetry(() =>
    client.chat.completions.create({
      model: MODEL,
      messages: [...messages, { role: "system", content: "Answer now using the information gathered so far; do not request more data." }],
      temperature: 0.4,
      max_tokens: 1500,
      reasoning_effort: "low",
    })
  );
  return final.choices[0]?.message?.content?.trim() || "I gathered some data but couldn't finish the answer. Please try a narrower question.";
}
