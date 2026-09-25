import type { NextRequest } from "next/server";
import { authenticate, isUserManager } from "@/app/server/middleware/auth";
import { getDeletedUsers } from "@/app/server/controllers/authController";

// GET /api/users/deleted - Fetch all deleted users
export async function GET(req: NextRequest) {
  return authenticate(req, async () => {
    return isUserManager(req, async () => {
      return getDeletedUsers(req);
    });
  });
}
