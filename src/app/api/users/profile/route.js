import { authenticate } from "@/app/server/middleware/auth.js";
import { updateUserProfile } from "@/app/server/controllers/authController.js";

// PUT /api/users/profile
export async function PUT(req) {
  // Update authenticated user's profile
  return authenticate(req, async () => {
    return updateUserProfile(req);
  });
}
