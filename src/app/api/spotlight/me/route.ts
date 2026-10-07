import type { NextRequest } from "next/server";
import { authenticateRequest } from "@/app/server/lib/requireAccess";
import { resolveScope } from "@/app/server/lib/spotlight/scope";
import { roleLabel } from "@/utils/roles";

/**
 * GET /api/spotlight/me
 * The signed-in user and where Spotlight should open for them: the network
 * view when they oversee several schools, otherwise their own school.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if ("response" in auth) return auth.response;
  const { user } = auth;

  const scope = await resolveScope(user);
  if (!scope) {
    return Response.json(
      { success: false, error: "Spotlight is available to school leaders, directors and administrators." },
      { status: 403 }
    );
  }

  return Response.json({
    success: true,
    data: {
      user: {
        id: String(user._id),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        roleLabel: roleLabel(user.role),
      },
      schoolCount: scope.schoolIds.length,
      landing: scope.network ? { level: "network", id: null } : { level: "school", id: String(scope.schoolIds[0]) },
    },
  });
}
