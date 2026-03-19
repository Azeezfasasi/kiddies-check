import { forgotPassword } from "@/app/server/controllers/authController.js";

// POST /api/auth/forgot-password
export async function POST(req) {
  return forgotPassword(req);
}
