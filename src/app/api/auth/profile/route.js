import { authenticate } from "@/app/server/middleware/auth.js";
import {
  getUserProfile,
  updateUserProfile,
} from "@/app/server/controllers/authController.js";

// GET /api/auth/profile
export async function GET(req) {
  return authenticate(req, async () => {
    return getUserProfile(req);
  });
}

// PUT /api/auth/profile
export async function PUT(req) {
  return authenticate(req, async () => {
    return updateUserProfile(req);
  });
}
