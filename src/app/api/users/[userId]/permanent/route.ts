import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { permanentlyDeleteUser } from "@/app/server/controllers/authController";

// DELETE /api/users/[userId]/permanent - Permanently delete a user from database
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return permanentlyDeleteUser(req, userId);
    });
  });
}
