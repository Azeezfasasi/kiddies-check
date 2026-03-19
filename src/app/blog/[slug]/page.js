'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch blog details
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/blog`);
        
        // Normalize slug for comparison
        const normalizedSlug = decodeURIComponent(slug).toLowerCase().trim();
        
        // Find blog by slug with case-insensitive matching
        const foundBlog = response.data.find(b => 
          b.urlSlug && b.urlSlug.toLowerCase().trim() === normalizedSlug
        );
        
        if (!foundBlog) {
          console.warn('Blog not found. Slug:', normalizedSlug);
          console.log('Available blogs:', response.data.map(b => ({ title: b.postTitle, slug: b.urlSlug })));
          setError('Blog not found');
          return;
        }
        
        setBlog(foundBlog);
        
        // Check if user already liked
        if (user && foundBlog.likedBy?.includes(user._id)) {
          setIsLiked(true);
        }
      } catch (err) {
        console.error('Failed to fetch blog:', err);
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug, user]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    try {
      if (isLiked) {
        await axios.delete(`/api/blog/${blog._id}/like`, {
          data: { userId: user._id },
        });
      } else {
        await axios.post(`/api/blog/${blog._id}/like`, {
          userId: user._id,
        });
      }

      setIsLiked(!isLiked);
      setBlog(prev => ({
        ...prev,
        likes: isLiked ? prev.likes - 1 : prev.likes + 1,
      }));
    } catch (err) {
      console.error('Failed to update like:', err);
    }
  };

  // Handle add comment
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await axios.post(`/api/blog/${blog._id}/comments`, {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        userAvatar: user.avatar,
        text: commentText,
      });

      if (response.data.success) {
        setBlog(prev => ({
          ...prev,
          comments: response.data.comments,
        }));
        setCommentText('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await axios.delete(`/api/blog/${blog._id}/comments`, {
        data: { commentId },
      });

      if (response.data.success) {
        setBlog(prev => ({
          ...prev,
          comments: response.data.comments,
        }));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-600 text-lg mb-4">{error || 'Blog not found'}</p>
        <Link href="/blog" className="text-blue-500 hover:text-blue-700">
          Back to blogs
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/blog" className="text-blue-900 hover:text-blue-800 mb-4 inline-block">
            ← Back to blogs
          </Link>
          <h1 className="text-[26px] md:text-5xl font-bold text-gray-900 mb-4">{blog.postTitle}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
            <span className="text-sm font-semibold text-blue-900 uppercase">{blog.category}</span>-
            <span>By {blog.author}</span>-
            <span>{new Date(blog.publishDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
        </div>

        {/* Featured Image */}
        {blog.featuredImage && (
          <div className="mb-8 rounded-lg overflow-hidden max-h-110">
            <img src={blog.featuredImage} alt={blog.postTitle} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="prose prose-lg max-w-none mb-8">
            {blog.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() && <p key={idx} className="text-gray-700 mb-4 leading-relaxed">{paragraph}</p>
            ))}
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
              {blog.tags.map((tag, idx) => (
                <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Like Section */}
        {/* <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-600'
            }`}
          >
            <span className="text-xl">❤️</span>
            <span>{isLiked ? 'Liked' : 'Like'} ({blog.likes || 0})</span>
          </button>
        </div> */}

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments ({blog.comments?.length || 0})</h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8 pb-8 border-b border-gray-400">
              <div className="flex gap-4 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-900 text-white font-bold">
                      {user.firstName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
                    rows="4"
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="mt-3 px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium cursor-pointer"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 pb-8 border-b bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">
                <Link href="/login" className="text-blue-900 hover:text-blue-800 font-medium">
                  Login
                </Link>
                {' '}to post a comment
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {blog.comments && blog.comments.length > 0 ? (
              blog.comments.map((comment) => (
                <div key={comment._id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                    {comment.userAvatar ? (
                      <img src={comment.userAvatar} alt={comment.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-900 text-white font-bold text-sm">
                        {comment.userName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{comment.userName}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {user && user._id === comment.userId && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
