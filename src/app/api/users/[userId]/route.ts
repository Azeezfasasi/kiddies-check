import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import {
  getUserById,
  updateUserById,
  deleteUser,
} from "@/app/server/controllers/authController";

// GET /api/users/[userId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return getUserById(req, userId);
    });
  });
}

// PUT /api/users/[userId]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return updateUserById(req, userId);
    });
  });
}

// DELETE /api/users/[userId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return deleteUser(req, userId);
    });
  });
}
