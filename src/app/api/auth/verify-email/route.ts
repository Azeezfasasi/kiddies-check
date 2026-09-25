import type { NextRequest } from "next/server";
import { verifyEmail } from "@/app/server/controllers/authController";

// POST /api/auth/verify-email
export async function POST(req: NextRequest) {
  return verifyEmail(req);
}
