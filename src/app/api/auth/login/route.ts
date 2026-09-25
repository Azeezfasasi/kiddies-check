import type { NextRequest } from "next/server";
import { login } from "@/app/server/controllers/authController";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  return login(req);
}
