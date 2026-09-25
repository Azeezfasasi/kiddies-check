import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { getAllUsers, createUserByAdmin } from "@/app/server/controllers/authController";

// GET /api/users
export async function GET(req: NextRequest) {
  // List all users (admin only)
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return getAllUsers(req);
    });
  });
}

// POST /api/users
export async function POST(req: NextRequest) {
  // Create user with role assignment (admin only)
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return createUserByAdmin(req);
    });
  });
}
