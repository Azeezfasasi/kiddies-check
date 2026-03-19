import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import { changeUserRole } from "@/app/server/controllers/authController.js";

// PUT /api/users/[userId]/role
export async function PUT(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return changeUserRole(req, userId);
    });
  });
}
