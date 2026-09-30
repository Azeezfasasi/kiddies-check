import { withAudit } from "@/app/server/lib/audit";
import type { NextRequest } from "next/server";
import { connectDB } from '../../../../utils/db';
import { getBlogById, updateBlog, deleteBlog, changeBlogStatus } from '../../../server/controllers/blogController';
import { requireAccess } from "@/app/server/lib/requireAccess";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  await connectDB();
  return getBlogById(req, context);
}

async function putHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "blog");
  if (denied) return denied;
  await connectDB();
  return updateBlog(req, context);
}

async function deleteHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "blog");
  if (denied) return denied;
  await connectDB();
  return deleteBlog(req, context);
}

async function patchHandler(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAccess(req, "blog");
  if (denied) return denied;
  await connectDB();
  return changeBlogStatus(req, context);
}

export const PUT = withAudit(putHandler);
export const DELETE = withAudit(deleteHandler);
export const PATCH = withAudit(patchHandler);
