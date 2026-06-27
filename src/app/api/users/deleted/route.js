import { authenticate, isAdmin } from "@/app/server/middleware/auth.js";
import { getDeletedUsers } from "@/app/server/controllers/authController.js";

// GET /api/users/deleted - Fetch all deleted users
export async function GET(req) {
  return authenticate(req, async () => {
    return isAdmin(req, async () => {
      return getDeletedUsers(req);
    });
  });
}
