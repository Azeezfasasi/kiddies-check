import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import { getAllUsers, createUserByAdmin } from "@/app/server/controllers/authController.js";

// GET /api/users
export async function GET(req) {
  // List all users (admin only)
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return getAllUsers(req);
    });
  });
}

// POST /api/users
export async function POST(req) {
  // Create user with role assignment (admin only)
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return createUserByAdmin(req);
    });
  });
}
