import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import { permanentlyDeleteUser } from "@/app/server/controllers/authController.js";

// DELETE /api/users/[userId]/permanent - Permanently delete a user from database
export async function DELETE(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return permanentlyDeleteUser(req, userId);
    });
  });
}
