import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { register } from "@/app/server/controllers/authController";

// POST /api/auth/register
async function postHandler(req: NextRequest) {
  return register(req);
}

export const POST = withAudit(postHandler);
