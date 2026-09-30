import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { resetPassword } from "@/app/server/controllers/authController";

// POST /api/auth/reset-password
async function postHandler(req: NextRequest) {
  return resetPassword(req);
}

export const POST = withAudit(postHandler);
