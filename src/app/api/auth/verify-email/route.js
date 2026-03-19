import { verifyEmail } from "@/app/server/controllers/authController.js";

// POST /api/auth/verify-email
export async function POST(req) {
  return verifyEmail(req);
}
