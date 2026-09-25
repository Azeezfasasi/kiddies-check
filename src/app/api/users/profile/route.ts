import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { updateUserProfile } from "@/app/server/controllers/authController";

// PUT /api/users/profile
export async function PUT(req: NextRequest) {
  // Update authenticated user's profile
  return authenticate(req, async () => {
    return updateUserProfile(req);
  });
}
