import { connectDB } from '../../../utils/db';
import { createBlog, getAllBlogs } from '../../server/controllers/blogController';

export async function POST(req, res) {
  await connectDB();
  return createBlog(req, res);
}

export async function GET(req, res) {
  await connectDB();
  return getAllBlogs(req, res);
}
