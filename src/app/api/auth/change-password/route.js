import { authenticate } from "@/app/server/middleware/auth.js";
import { updatePassword } from "@/app/server/controllers/authController.js";

// POST /api/auth/change-password
export async function POST(req) {
  return authenticate(req, async () => {
    return updatePassword(req);
  });
}
