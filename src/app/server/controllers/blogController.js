import { connectDB } from '../db/connect';
import Blog from '../models/Blog';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload file to Cloudinary
async function uploadToCloudinary(fileBuffer, fileName, folder = 'blog') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        public_id: fileName.split('.')[0],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

export async function createBlog(req) {
  await connectDB();
  try {
    const form = await req.formData();
    const blogData = {};
    
    for (const [key, value] of form.entries()) {
      if (key === 'blogImages' || key === 'featuredImage') {
        if (value instanceof File) {
          // Convert file to buffer and upload to Cloudinary
          const buffer = await value.arrayBuffer();
          const uploadResult = await uploadToCloudinary(
            Buffer.from(buffer),
            value.name,
            'blog'
          );
          
          if (key === 'featuredImage') {
            blogData[key] = uploadResult.secure_url;
          } else if (key === 'blogImages') {
            if (!blogData[key]) blogData[key] = [];
            blogData[key].push(uploadResult.secure_url);
          }
        }
      } else {
        blogData[key] = value;
      }
    }
    
    const blog = new Blog(blogData);
    await blog.save();
    return new Response(JSON.stringify(blog), { status: 201 });
  } catch (err) {
    console.error('Blog creation error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function getAllBlogs() {
  await connectDB();
  try {
    const blogs = await Blog.find().sort({ publishDate: -1 });
    return new Response(JSON.stringify(blogs), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function getBlogById(req, { params }) {
  await connectDB();
  try {
    const blog = await Blog.findById(params.id);
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    return new Response(JSON.stringify(blog), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function updateBlog(req, { params }) {
  await connectDB();
  try {
    const { id } = await params;
    const form = await req.formData();
    const blogData = {};
    
    for (const [key, value] of form.entries()) {
      if (key === 'featuredImage' && value instanceof File) {
        // Upload new featured image to Cloudinary
        const buffer = await value.arrayBuffer();
        const uploadResult = await uploadToCloudinary(
          Buffer.from(buffer),
          value.name,
          'blog'
        );
        blogData[key] = uploadResult.secure_url;
      } else if (key === 'tags') {
        // Parse tags from comma-separated string
        blogData[key] = value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);
      } else if (key === 'publishDate' && value) {
        // Convert date string to ISO format
        blogData[key] = new Date(value).toISOString();
      } else if (value && key !== 'featuredImagePreview') {
        blogData[key] = value;
      }
    }

    const blog = await Blog.findByIdAndUpdate(id, blogData, { new: true });
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    return new Response(JSON.stringify(blog), { status: 200 });
  } catch (err) {
    console.error('Update blog error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

export async function deleteBlog(req, { params }) {
  await connectDB();
  try {
    const blog = await Blog.findByIdAndDelete(params.id);
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    return new Response(JSON.stringify({ message: 'Blog deleted' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function changeBlogStatus(req, { params }) {
  await connectDB();
  try {
    const { status } = await req.json();
    if (!['draft', 'published'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
    }
    const blog = await Blog.findByIdAndUpdate(params.id, { status }, { new: true });
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    return new Response(JSON.stringify(blog), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}

// Add like to blog
export async function addLike(req, { params }) {
  await connectDB();
  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    const blog = await Blog.findById(params.id);
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });

    // Check if user already liked
    if (blog.likedBy.includes(userId)) {
      return new Response(JSON.stringify({ error: 'Already liked' }), { status: 400 });
    }

    blog.likes += 1;
    blog.likedBy.push(userId);
    await blog.save();

    return new Response(JSON.stringify({ success: true, likes: blog.likes }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Remove like from blog
export async function removeLike(req, { params }) {
  await connectDB();
  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
    }

    const blog = await Blog.findById(params.id);
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });

    // Check if user liked
    if (!blog.likedBy.includes(userId)) {
      return new Response(JSON.stringify({ error: 'Not liked yet' }), { status: 400 });
    }

    blog.likes = Math.max(0, blog.likes - 1);
    blog.likedBy = blog.likedBy.filter(id => id.toString() !== userId);
    await blog.save();

    return new Response(JSON.stringify({ success: true, likes: blog.likes }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Add comment to blog
export async function addComment(req, { params }) {
  await connectDB();
  try {
    const { userId, userName, userEmail, userAvatar, text } = await req.json();

    if (!text || !userName) {
      return new Response(JSON.stringify({ error: 'Comment text and user name required' }), { status: 400 });
    }

    const blog = await Blog.findById(params.id);
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });

    const comment = {
      userId,
      userName,
      userEmail,
      userAvatar,
      text,
      createdAt: new Date(),
    };

    blog.comments.push(comment);
    await blog.save();

    return new Response(JSON.stringify({ success: true, comment, comments: blog.comments }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Delete comment
export async function deleteComment(req, { params }) {
  await connectDB();
  try {
    const { commentId } = await req.json();
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), { status: 400 });
    }

    const blog = await Blog.findById(params.id);
    if (!blog) return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });

    blog.comments = blog.comments.filter(comment => comment._id.toString() !== commentId);
    await blog.save();

    return new Response(JSON.stringify({ success: true, comments: blog.comments }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
