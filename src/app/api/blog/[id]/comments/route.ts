import type { NextRequest } from "next/server";
import { addComment, deleteComment } from '../../../../server/controllers/blogController';
import { connectDB } from '../../../../../utils/db';

// POST /api/blog/[id]/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  return addComment(req, { params: resolvedParams });
}

// DELETE /api/blog/[id]/comments
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  return deleteComment(req, { params: resolvedParams });
}
