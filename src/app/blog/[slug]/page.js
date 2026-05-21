import React from 'react';
import BlogDetailClient from './blog-detail-client';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kiddiescheck.org';

// Server-side metadata generation for dynamic routes
export async function generateMetadata({ params }) {
  try {
    const response = await fetch(`${baseUrl}/api/blog`, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) throw new Error('Failed to fetch blogs');
    
    const blogs = await response.json();
    const normalizedSlug = decodeURIComponent(params.slug).toLowerCase().trim();
    
    const blog = blogs.find(b => 
      b.urlSlug && b.urlSlug.toLowerCase().trim() === normalizedSlug
    );
    
    if (!blog) {
      return {
        title: 'Blog Post Not Found | KiddiesCheck',
        description: 'The blog post you are looking for does not exist.',
        robots: { index: false },
      };
    }
    
    const postUrl = `${baseUrl}/blog/${blog.urlSlug}`;
    const description = blog.content?.substring(0, 160) || blog.postTitle;
    
    return {
      title: `${blog.postTitle} | KiddiesCheck Blog`,
      description: description,
      keywords: [blog.category, ...(blog.tags || []), 'child safety', 'parenting'],
      authors: [{ name: blog.author }],
      openGraph: {
        type: 'article',
        title: blog.postTitle,
        description: description,
        url: postUrl,
        siteName: 'KiddiesCheck',
        publishedTime: blog.publishDate,
        authors: [blog.author],
        tags: blog.tags,
        images: blog.featuredImage ? [
          {
            url: blog.featuredImage,
            width: 1200,
            height: 630,
            alt: blog.postTitle,
            type: 'image/jpeg',
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: blog.postTitle,
        description: description,
        creator: '@kiddiescheck',
        images: blog.featuredImage ? [blog.featuredImage] : undefined,
      },
      alternates: {
        canonical: postUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog Post | KiddiesCheck',
      description: 'Read our latest insights on child safety and parenting.',
    };
  }
}

// Generate static paths for dynamic routes (for better performance)
export async function generateStaticParams() {
  try {
    const response = await fetch(`${baseUrl}/api/blog`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) return [];
    
    const blogs = await response.json();
    return blogs.map((blog) => ({
      slug: blog.urlSlug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function BlogDetailPage({ params }) {
  return <BlogDetailClient slug={params.slug} />;
}
