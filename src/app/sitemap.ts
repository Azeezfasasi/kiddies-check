/**
 * Generates a dynamic sitemap including static and dynamic routes
 * for better SEO and search engine crawling.
 * @returns {Array<Object>} Array of sitemap entry objects
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kiddiescheck.org';

// Fetch all blogs for sitemap
async function getBlogs() {
  try {
    const response = await fetch(`${baseUrl}/api/blog`, {
      next: { revalidate: 86400 }, // Revalidate daily
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error);
    return [];
  }
}

// Fetch all galleries for sitemap
async function getGalleries() {
  try {
    const response = await fetch(`${baseUrl}/api/gallery?limit=1000`, {
      next: { revalidate: 86400 }, // Revalidate daily
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.galleries || [];
  } catch (error) {
    console.error('Error fetching galleries for sitemap:', error);
    return [];
  }
}

export default async function sitemap() {
  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Fetch dynamic content
  const [blogs, galleries] = await Promise.all([
    getBlogs(),
    getGalleries(),
  ]);

  // Dynamic blog routes
  const blogRoutes = blogs
    .filter(blog => blog.status === 'published' && blog.urlSlug)
    .map(blog => ({
      url: `${baseUrl}/blog/${blog.urlSlug}`,
      lastModified: blog.updatedAt || blog.publishDate || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  // Dynamic gallery routes
  const galleryRoutes = galleries
    .filter(gallery => gallery.status === 'active')
    .map(gallery => ({
      url: `${baseUrl}/gallery/${gallery._id}`,
      lastModified: gallery.updatedAt || gallery.createdAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

  return [...staticRoutes, ...blogRoutes, ...galleryRoutes];
}
