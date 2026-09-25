import type { NextRequest } from "next/server";
import { connectDB } from '../../../../utils/db';
import { getBlogById, updateBlog, deleteBlog, changeBlogStatus } from '../../../server/controllers/blogController';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  return getBlogById(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  return updateBlog(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  return deleteBlog(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  return changeBlogStatus(req, context);
}
