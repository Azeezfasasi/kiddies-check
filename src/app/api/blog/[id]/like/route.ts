import type { NextRequest } from "next/server";
// import { addLike, removeLike } from '@/app/server/controllers/blogController';
// import { connectDB } from '@/app/server/db';

// // POST /api/blog/[id]/like
// export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   await connectDB();
//   const resolvedParams = await params;
//   return addLike(req, { params: resolvedParams });
// }

// // DELETE /api/blog/[id]/like
// export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
//   await connectDB();
//   const resolvedParams = await params;
//   return removeLike(req, { params: resolvedParams });
// }

// Likes are disabled; kept as an empty module so TypeScript route checks pass.
export {};
