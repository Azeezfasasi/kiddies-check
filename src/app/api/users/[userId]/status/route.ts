import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { toggleUserStatus } from "@/app/server/controllers/authController";

// PUT /api/users/[userId]/status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return toggleUserStatus(req, userId);
    });
  });
}
