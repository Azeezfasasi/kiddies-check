import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import {
  getUserById,
  updateUserById,
  deleteUser,
} from "@/app/server/controllers/authController.js";

// GET /api/users/[userId]
export async function GET(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return getUserById(req, userId);
    });
  });
}

// PUT /api/users/[userId]
export async function PUT(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return updateUserById(req, userId);
    });
  });
}

// DELETE /api/users/[userId]
export async function DELETE(req, { params }) {
  const { userId } = await params;
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return deleteUser(req, userId);
    });
  });
}
