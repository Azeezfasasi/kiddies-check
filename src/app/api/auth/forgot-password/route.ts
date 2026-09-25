import type { NextRequest } from "next/server";
import { forgotPassword } from "@/app/server/controllers/authController";

// POST /api/auth/forgot-password
export async function POST(req: NextRequest) {
  return forgotPassword(req);
}
