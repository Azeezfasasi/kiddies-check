import { register } from "@/app/server/controllers/authController.js";

// POST /api/auth/register
export async function POST(req) {
  return register(req);
}
