import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { unlockUser } from "@/app/server/controllers/authController";

// POST /api/users/[userId]/unlock - lift a lockout from too many failed logins (admins only)
async function postHandler(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return unlockUser(req, userId);
    });
  });
}

export const POST = withAudit(postHandler);
