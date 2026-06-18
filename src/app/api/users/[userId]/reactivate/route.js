import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import { reactivateUser, permanentlyDeleteUser } from "@/app/server/controllers/authController.js";

// PUT /api/users/[userId]/reactivate - Re-activate a deleted user
export async function PUT(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return reactivateUser(req, userId);
    });
  });
}
