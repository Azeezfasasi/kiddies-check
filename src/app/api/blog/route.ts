import type { NextRequest } from "next/server";
import { connectDB } from '../../../utils/db';
import { createBlog, getAllBlogs } from '../../server/controllers/blogController';
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function POST(req: NextRequest) {
  const denied = await requireAccess(req, "blog");
  if (denied) return denied;
  await connectDB();
  return createBlog(req);
}

export async function GET() {
  await connectDB();
  return getAllBlogs();
}
