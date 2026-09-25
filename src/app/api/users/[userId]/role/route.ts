import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { changeUserRole } from "@/app/server/controllers/authController";

// PUT /api/users/[userId]/role
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return changeUserRole(req, userId);
    });
  });
}
