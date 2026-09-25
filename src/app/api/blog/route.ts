import type { NextRequest } from "next/server";
import { connectDB } from '../../../utils/db';
import { createBlog, getAllBlogs } from '../../server/controllers/blogController';

export async function POST(req: NextRequest) {
  await connectDB();
  return createBlog(req);
}

export async function GET() {
  await connectDB();
  return getAllBlogs();
}
