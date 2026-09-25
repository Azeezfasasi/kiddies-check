import jwt from "jsonwebtoken";
import { connectDB } from "@/app/server/db/connect";
import User, { type UserDocument } from "@/app/server/models/User";
import { can, type AccessLevel, type Feature } from "@/utils/roles";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/** Roles that manage site content today, before platform permissions. */
export const CONTENT_ROLES = ["admin", "learning-specialist"];

const deny = (message: string, status: number) => Response.json({ success: false, message, error: message }, { status });

const readToken = (req: Request): string | null => {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)token=([^;]+)/);
  return cookie ? decodeURIComponent(cookie[1]) : null;
};

/** Returns the signed-in, active user for the request, or a 401 response. */
export async function authenticateRequest(req: Request): Promise<{ user: UserDocument } | { response: Response }> {
  const token = readToken(req);
  if (!token) return { response: deny("Authentication required", 401) };

  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return { response: deny("Invalid or expired token", 401) };
  }
  if (typeof decoded === "string" || !decoded.id) return { response: deny("Invalid token", 401) };

  await connectDB();
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) return { response: deny("Account not found or disabled", 401) };
  if (typeof decoded.iat === "number" && user.changedPasswordAfter(decoded.iat)) {
    return { response: deny("Password recently changed. Please log in again.", 401) };
  }
  return { user };
}

/**
 * Authenticates the request and checks the user may act on `feature`:
 * one of `roles` (default: admin, learning-specialist) or a platform role
 * granted the feature at `level` in the permission map.
 */
export async function authorizeAccess(
  req: Request,
  feature: Feature,
  { roles = CONTENT_ROLES, level = "edit" }: { roles?: string[]; level?: AccessLevel } = {}
): Promise<{ user: UserDocument } | { response: Response }> {
  const auth = await authenticateRequest(req);
  if ("response" in auth) return auth;
  if (!(roles.includes(auth.user.role) || can(auth.user.role, feature, level))) {
    return { response: deny("You do not have permission to do this", 403) };
  }
  return auth;
}

/** Guard form: returns a 401/403 Response to send back, or null when allowed. */
export async function requireAccess(
  req: Request,
  feature: Feature,
  options?: { roles?: string[]; level?: AccessLevel }
): Promise<Response | null> {
  const result = await authorizeAccess(req, feature, options);
  return "response" in result ? result.response : null;
}

/** Guard form of authenticateRequest: any signed-in, active user. */
export async function requireLogin(req: Request): Promise<Response | null> {
  const result = await authenticateRequest(req);
  return "response" in result ? result.response : null;
}
