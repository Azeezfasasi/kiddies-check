import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { updatePassword } from "@/app/server/controllers/authController";

// PUT /api/users/change-password
async function putHandler(req: NextRequest) {
  // Change authenticated user's password
  return authenticate(req, async () => {
    return updatePassword(req);
  });
}

export const PUT = withAudit(putHandler);
