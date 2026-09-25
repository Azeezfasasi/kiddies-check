import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { updatePassword } from "@/app/server/controllers/authController";

// POST /api/auth/change-password
export async function POST(req: NextRequest) {
  return authenticate(req, async () => {
    return updatePassword(req);
  });
}
