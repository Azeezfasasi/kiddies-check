import { after } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connectDB } from "@/app/server/db/connect";
import User from "@/app/server/models/User";
import ActivityLog from "@/app/server/models/ActivityLog";
import { auditContext } from "./auditContext";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

type RouteContext = { params?: Promise<Record<string, string | string[]>> | Record<string, string | string[]> };
type Handler<Req extends Request, Ctx> = (req: Req, ctx: Ctx) => Promise<Response> | Response;

const METHOD_ACTIONS: Record<string, string> = { POST: "create", PUT: "update", PATCH: "update", DELETE: "delete" };

// A trailing path segment that names the operation better than the HTTP method does
const SEGMENT_ACTIONS: Record<string, string> = {
  import: "import", "bulk-upload": "import", export: "export",
  upload: "upload", notebook: "upload-notebook", attendance: "mark-attendance",
  parent: "assign-parent", feedback: "send-feedback", reminders: "send", send: "send",
  "resend-invite": "send", submit: "submit", approve: "approve", reject: "reject", join: "join", accept: "accept",
};

const VERBS: Record<string, string> = {
  create: "Created", update: "Updated", delete: "Deleted", import: "Imported", export: "Exported",
  upload: "Uploaded", "upload-notebook": "Uploaded notebook for", "mark-attendance": "Marked attendance for",
  "assign-parent": "Changed parent link for", "send-feedback": "Sent feedback for", send: "Sent",
  submit: "Submitted", approve: "Approved", reject: "Rejected", join: "Joined", accept: "Accepted",
};

// Path prefixes that group routes rather than name the thing being changed
const NAMESPACES = new Set(["api", "teacher", "school", "admin", "parent", "logs"]);

const SECRET_KEYS = /pass(word)?|token|secret|otp|code|pin/i;
const MAX_CHANGE_CHARS = 4000;

const singular = (word: string) =>
  word.replace(/ies$/, "y").replace(/(ss|sh|ch|x)es$/, "$1").replace(/(?<!s)s$/, "");

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, SECRET_KEYS.test(k) ? "[redacted]" : redact(v, depth + 1)])
  );
}

function truncate(value: unknown) {
  if (value == null) return undefined;
  const text = JSON.stringify(value);
  return text.length > MAX_CHANGE_CHARS ? { truncated: text.slice(0, MAX_CHANGE_CHARS) } : value;
}

async function readJson(source: Request | Response): Promise<Record<string, unknown> | null> {
  if (!source.headers.get("content-type")?.includes("application/json")) return null;
  try {
    const parsed = await source.clone().json();
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function resolveActorId(req: Request): Promise<string | null> {
  const bearer = req.headers.get("authorization");
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)token=([^;]+)/);
  const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : cookie ? decodeURIComponent(cookie[1]) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return typeof decoded !== "string" && decoded.id ? String(decoded.id) : null;
  } catch {
    return null;
  }
}

/** Best-effort human name for the record a response returned. */
function entityNameFrom(body: Record<string, unknown> | null): string | undefined {
  if (!body) return undefined;
  const candidates = [body, body.data, ...Object.values(body)].filter(
    (v): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v)
  );
  for (const c of candidates) {
    if (typeof c.firstName === "string") return `${c.firstName} ${c.lastName ?? ""}`.trim();
    for (const key of ["name", "title", "subject", "email"]) {
      if (typeof c[key] === "string" && c[key]) return c[key] as string;
    }
  }
  return undefined;
}

function entityIdFrom(body: Record<string, unknown> | null, paramIds: string[]): string | undefined {
  if (paramIds.length) return paramIds[0];
  const data = body?.data as Record<string, unknown> | undefined;
  const id = data?._id ?? (body && Object.values(body).find((v) => v && typeof v === "object" && "_id" in v) as { _id?: unknown })?._id;
  return id ? String(id) : undefined;
}

function schoolIdFrom(req: Request, body: Record<string, unknown> | null, fallback: unknown) {
  const candidate = body?.schoolId ?? body?.school ?? new URL(req.url).searchParams.get("schoolId") ?? fallback;
  return candidate && mongoose.Types.ObjectId.isValid(String(candidate)) ? String(candidate) : undefined;
}

/**
 * Wraps a route handler so every call is recorded in ActivityLog: who made it,
 * what they changed, and whether it worked. Skips anonymous calls and routes
 * that already wrote their own, more detailed, log entry.
 */
export function withAudit<Req extends Request, Ctx extends RouteContext>(handler: Handler<Req, Ctx>) {
  return async (req: Req, ctx: Ctx): Promise<Response> => {
    const store = { logged: false };
    const requestBody = await readJson(req);
    const response = await auditContext.run(store, () => handler(req, ctx));

    after(async () => {
      try {
        if (store.logged) return;
        const actorId = await resolveActorId(req);
        if (!actorId) return;

        await connectDB();
        const actor = await User.findById(actorId)
          .select("firstName lastName email role schoolId")
          .populate("schoolId", "name")
          .lean<{ _id: unknown; firstName?: string; lastName?: string; email?: string; role?: string; schoolId?: { _id: unknown; name?: string } | null }>();
        if (!actor) return;

        const params = ctx?.params ? await ctx.params : {};
        const paramIds = Object.values(params).flat().map(String);
        const segments = new URL(req.url).pathname.split("/").filter(Boolean);
        // The entity is the collection just before the first id (".../bills/[id]/payments" -> bill)
        const firstId = segments.findIndex((s) => paramIds.includes(s));
        const named = segments.filter((s) => !NAMESPACES.has(s) && !paramIds.includes(s));
        const owner = firstId > 0 && !NAMESPACES.has(segments[firstId - 1]) ? segments[firstId - 1] : named[0];
        const entity = singular(owner ?? "other");
        const last = named[named.length - 1];
        const sub = last && singular(last) !== entity ? last : undefined;

        const action = (sub && SEGMENT_ACTIONS[sub]) || SEGMENT_ACTIONS[named[0]] || METHOD_ACTIONS[req.method] || "other";
        const responseBody = await readJson(response);
        const entityName = entityNameFrom(responseBody) ?? entityNameFrom(requestBody);
        const failed = response.status >= 400;
        const errorMessage = failed ? String(responseBody?.error ?? responseBody?.message ?? `HTTP ${response.status}`) : undefined;

        const target = [entity.replace(/-/g, " "), sub && sub !== action ? `(${sub.replace(/-/g, " ")})` : "", entityName ? `"${entityName}"` : ""]
          .filter(Boolean)
          .join(" ");

        await ActivityLog.create({
          user: actor._id,
          email: actor.email,
          firstName: actor.firstName,
          lastName: actor.lastName,
          userRole: actor.role,
          school: schoolIdFrom(req, requestBody, actor.schoolId?._id),
          schoolName: actor.schoolId?.name,
          action,
          entityType: entity,
          entityId: entityIdFrom(responseBody, paramIds),
          entityName,
          description: `${failed ? "Failed: " : ""}${VERBS[action] ?? action} ${target}`,
          changes: requestBody ? { before: null, after: truncate(redact(requestBody)) } : undefined,
          status: failed ? "failed" : "success",
          errorMessage,
          ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || undefined,
          method: req.method,
          path: new URL(req.url).pathname,
        });
      } catch (error) {
        console.warn("[Audit Log Error]", error);
      }
    });

    return response;
  };
}
