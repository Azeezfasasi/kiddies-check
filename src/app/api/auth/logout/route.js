import { authenticate } from "@/app/server/middleware/auth.js";
import { logout } from "@/app/server/controllers/authController.js";

// POST /api/auth/logout
export async function POST(req) {
  return authenticate(req, async () => {
    return logout(req);
  });
}
