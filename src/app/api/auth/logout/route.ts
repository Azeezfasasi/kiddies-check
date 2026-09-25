import type { NextRequest } from "next/server";
import { authenticate } from "@/app/server/middleware/auth";
import { logout } from "@/app/server/controllers/authController";

// POST /api/auth/logout
export async function POST(req: NextRequest) {
  return authenticate(req, async () => {
    return logout(req);
  });
}
