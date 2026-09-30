import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { forgotPassword } from "@/app/server/controllers/authController";

// POST /api/auth/forgot-password
async function postHandler(req: NextRequest) {
  return forgotPassword(req);
}

export const POST = withAudit(postHandler);
