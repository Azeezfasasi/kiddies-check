import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { logout } from "@/app/server/controllers/authController";

// POST /api/auth/logout
async function postHandler(req: NextRequest) {
  return authenticate(req, async () => {
    return logout(req);
  });
}

export const POST = withAudit(postHandler);
