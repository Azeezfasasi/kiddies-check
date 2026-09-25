import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { adminResetPassword } from "@/app/server/controllers/authController";

// POST /api/users/[userId]/reset-password
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return adminResetPassword(req, userId);
    });
  });
}
