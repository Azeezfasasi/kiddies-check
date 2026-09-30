import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { updatePassword } from "@/app/server/controllers/authController";

// POST /api/auth/change-password
async function postHandler(req: NextRequest) {
  return authenticate(req, async () => {
    return updatePassword(req);
  });
}

export const POST = withAudit(postHandler);
