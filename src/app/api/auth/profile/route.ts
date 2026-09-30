import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import {
  getUserProfile,
  updateUserProfile,
} from "@/app/server/controllers/authController";

// GET /api/auth/profile
export async function GET(req: NextRequest) {
  return authenticate(req, async () => {
    return getUserProfile(req);
  });
}

// PUT /api/auth/profile
async function putHandler(req: NextRequest) {
  return authenticate(req, async () => {
    return updateUserProfile(req);
  });
}

export const PUT = withAudit(putHandler);
