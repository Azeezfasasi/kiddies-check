import { connectDB } from '../../../../utils/db';
import { getBlogById, updateBlog, deleteBlog, changeBlogStatus } from '../../../server/controllers/blogController';

export async function GET(req, context) {
  await connectDB();
  return getBlogById(req, context);
}

export async function PUT(req, context) {
  await connectDB();
  return updateBlog(req, context);
}

export async function DELETE(req, context) {
  await connectDB();
  return deleteBlog(req, context);
}

export async function PATCH(req, context) {
  await connectDB();
  return changeBlogStatus(req, context);
}
