import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { verifyEmail } from "@/app/server/controllers/authController";

// POST /api/auth/verify-email
async function postHandler(req: NextRequest) {
  return verifyEmail(req);
}

export const POST = withAudit(postHandler);
