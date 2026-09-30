import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { adminResetPassword } from "@/app/server/controllers/authController";

// POST /api/users/[userId]/reset-password
async function postHandler(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return adminResetPassword(req, userId);
    });
  });
}

export const POST = withAudit(postHandler);
