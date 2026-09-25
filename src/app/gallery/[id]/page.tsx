import React from 'react';
import GalleryDetailClient from './gallery-detail-client';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kiddiescheck.org';

// Server-side metadata generation
export async function generateMetadata({ params }) {
  try {
    const response = await fetch(`${baseUrl}/api/gallery/${params.id}`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) throw new Error('Failed to fetch gallery');
    
    const data = await response.json();
    const gallery = data.gallery || data.data || data;
    
    const galleryUrl = `${baseUrl}/gallery/${params.id}`;
    const description = gallery.description || `Gallery: ${gallery.title}`;
    const firstImage = gallery.images?.[0]?.url;
    
    return {
      title: `${gallery.title} | KiddiesCheck Gallery`,
      description: description,
      keywords: [gallery.category, 'gallery', 'images', gallery.businessName || ''].filter(Boolean),
      openGraph: {
        type: 'website',
        title: gallery.title,
        description: description,
        url: galleryUrl,
        siteName: 'KiddiesCheck',
        images: firstImage ? [
          {
            url: firstImage,
            width: 1200,
            height: 630,
            alt: gallery.title,
            type: 'image/jpeg',
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: gallery.title,
        description: description,
        creator: '@kiddiescheck',
        images: firstImage ? [firstImage] : undefined,
      },
      alternates: {
        canonical: galleryUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Gallery | KiddiesCheck',
      description: 'Browse our gallery of images.',
    };
  }
}

// Generate static paths
export async function generateStaticParams() {
  try {
    const response = await fetch(`${baseUrl}/api/gallery?limit=1000`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const galleries = data.galleries || [];
    
    return galleries.map((gallery) => ({
      id: gallery._id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function GalleryDetailPage({ params }) {
  return <GalleryDetailClient id={params.id} />;
}
