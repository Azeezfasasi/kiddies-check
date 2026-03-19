"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from 'next/link'
import axios from 'axios';

export default function BlogNews() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);

  // Fetch blogs from backend
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/blog');
        
        // Filter only published blogs
        const publishedBlogs = response.data.filter(blog => blog.status === 'published');
        setBlogs(publishedBlogs);

        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(publishedBlogs.map(blog => blog.category))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const filteredPosts =
    selectedCategory === "All"
      ? blogs
      : blogs.filter((post) => post.category === selectedCategory);

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 lg:px-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest Blog Posts</h2>
          <p className="text-gray-600">Insights and updates from our engineering team</p>
        </div>

        {/* Categories */}
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full font-medium transition ${
                selectedCategory === category
                  ? "bg-blue-900 text-white"
                  : "bg-white text-gray-800 border border-gray-300 hover:bg-blue-800 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {/* No Blogs */}
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No blog posts found in this category.</p>
          </div>
        )}

        {/* Blog Grid */}
        {!loading && filteredPosts.length > 0 && (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="relative w-full h-64 bg-gray-200">
                  {post.featuredImage ? (
                    <img src={post.featuredImage} alt={post.postTitle} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <span className="text-sm text-blue-900 font-semibold uppercase">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 mt-2 mb-2">{post.postTitle.split(" ").slice(0, 8).join(" ") + "…"}</h3>
                  {/* <p className="text-gray-600 mb-3 text-sm line-clamp-2">{post.content.substring(0, 100)}...</p> */}
                  <p className="text-gray-600 mb-3 text-sm line-clamp-2">{post.content.split(" ").slice(0, 20).join(" ") + "…"}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span className="font-semibold">{new Date(post.publishDate).toLocaleDateString()}</span>
                    {/* <span className="flex items-center gap-1">❤️ {post.likes || 0}</span> */}
                  </div>
                  <Link
                    href={`/blog/${post.urlSlug}`}
                    className="text-blue-900 font-semibold hover:text-blue-800 transition"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
