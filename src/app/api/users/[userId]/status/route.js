import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import { toggleUserStatus } from "@/app/server/controllers/authController.js";

// PUT /api/users/[userId]/status
export async function PUT(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return toggleUserStatus(req, userId);
    });
  });
}
