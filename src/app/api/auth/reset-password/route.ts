import type { NextRequest } from "next/server";
import { resetPassword } from "@/app/server/controllers/authController";

// POST /api/auth/reset-password
export async function POST(req: NextRequest) {
  return resetPassword(req);
}
