import { resetPassword } from "@/app/server/controllers/authController.js";

// POST /api/auth/reset-password
export async function POST(req) {
  return resetPassword(req);
}
