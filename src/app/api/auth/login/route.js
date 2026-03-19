import { login } from "@/app/server/controllers/authController.js";

// POST /api/auth/login
export async function POST(req) {
  return login(req);
}
