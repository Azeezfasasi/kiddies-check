import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { updateUserProfile } from "@/app/server/controllers/authController";

// PUT /api/users/profile
async function putHandler(req: NextRequest) {
  // Update authenticated user's profile
  return authenticate(req, async () => {
    return updateUserProfile(req);
  });
}

export const PUT = withAudit(putHandler);
