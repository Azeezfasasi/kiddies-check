import type { NextRequest } from "next/server";
import { register } from "@/app/server/controllers/authController";

// POST /api/auth/register
export async function POST(req: NextRequest) {
  return register(req);
}
