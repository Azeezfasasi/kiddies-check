import { authenticate } from "@/app/server/middleware/auth.js";
import { updatePassword } from "@/app/server/controllers/authController.js";

// PUT /api/users/change-password
export async function PUT(req) {
  // Change authenticated user's password
  return authenticate(req, async () => {
    return updatePassword(req);
  });
}
