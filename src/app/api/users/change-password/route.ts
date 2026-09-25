import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { updatePassword } from "@/app/server/controllers/authController";

// PUT /api/users/change-password
export async function PUT(req: NextRequest) {
  // Change authenticated user's password
  return authenticate(req, async () => {
    return updatePassword(req);
  });
}
