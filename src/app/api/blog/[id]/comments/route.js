import { addComment, deleteComment } from '../../../../server/controllers/blogController';
import { connectDB } from '../../../../../utils/db';

// POST /api/blog/[id]/comments
export async function POST(req, { params }) {
  await connectDB();
  const resolvedParams = await params;
  return addComment(req, { params: resolvedParams });
}

// DELETE /api/blog/[id]/comments
export async function DELETE(req, { params }) {
  await connectDB();
  const resolvedParams = await params;
  return deleteComment(req, { params: resolvedParams });
}
