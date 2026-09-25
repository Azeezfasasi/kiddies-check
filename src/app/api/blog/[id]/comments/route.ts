import type { NextRequest } from "next/server";
import { addComment, deleteComment } from '../../../../server/controllers/blogController';
import { connectDB } from '../../../../../utils/db';
import Blog from "@/app/server/models/Blog";
import { authenticateRequest } from "@/app/server/lib/requireAccess";
import { can } from "@/utils/roles";

// POST /api/blog/[id]/comments
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  return addComment(req, { params: resolvedParams });
}

// DELETE /api/blog/[id]/comments
// A comment can be deleted by its author or by someone who manages blogs.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if ("response" in auth) return auth.response;

  await connectDB();
  const resolvedParams = await params;
  const body = await req.json();

  const canManageBlog = ["admin", "learning-specialist"].includes(auth.user.role) || can(auth.user.role, "blog", "edit");
  if (!canManageBlog) {
    const blog = await Blog.findById(resolvedParams.id).select("comments").lean();
    const comment = (blog?.comments as { _id: { toString(): string }; userId?: { toString(): string } }[] | undefined)?.find(
      (c) => c._id.toString() === body?.commentId
    );
    if (comment && comment.userId?.toString() !== auth.user._id.toString()) {
      return Response.json({ error: "You can only delete your own comments" }, { status: 403 });
    }
  }

  req.json = async () => body;
  return deleteComment(req, { params: resolvedParams });
}
