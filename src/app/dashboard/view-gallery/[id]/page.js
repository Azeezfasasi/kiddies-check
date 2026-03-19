'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchGallery } from '@/app/utils/galleryApi';
import { ArrowLeft, Loader } from 'lucide-react';

export default function ViewGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await fetchGallery(params.id);
        setGallery(data);
      } catch (err) {
        setError(err.message || 'Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadGallery();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 sm:mb-8"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 text-center">
            <p className="text-red-600">{error || 'Gallery not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-3 sm:px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 sm:mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {/* Gallery Container */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-8 border-b border-gray-200">
            <div className="flex flex-col sm:items-start sm:justify-between gap-4 sm:flex-row">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {gallery.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                    gallery.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {gallery.status}
                  </span>
                  {gallery.featured && (
                    <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-yellow-100 text-yellow-800">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard/edit-gallery/${gallery._id}`)}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Gallery
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-8">
            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Category</h3>
                <p className="text-sm sm:text-lg text-gray-900">
                  {gallery.category.charAt(0).toUpperCase() + gallery.category.slice(1)}
                </p>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Views</h3>
                <p className="text-sm sm:text-lg text-gray-900">{gallery.views || 0}</p>
              </div>
              {gallery.businessName && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Business Name</h3>
                  <p className="text-sm sm:text-lg text-gray-900">{gallery.businessName}</p>
                </div>
              )}
              {gallery.location && (
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Location</h3>
                  <p className="text-sm sm:text-lg text-gray-900">{gallery.location}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {gallery.description && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{gallery.description}</p>
              </div>
            )}

            {/* Tags */}
            {gallery.tags && gallery.tags.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {gallery.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs sm:text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">
                Images ({gallery.images?.length || 0})
              </h3>
              {gallery.images && gallery.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {gallery.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={img.url}
                        alt={img.alt || `Image ${index + 1}`}
                        width={200}
                        height={160}
                        className="w-full h-20 sm:h-32 lg:h-40 object-cover rounded-lg"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 sm:p-2 rounded-b-lg">
                        <p className="text-xs sm:text-sm">{index + 1}/{gallery.images.length}</p>
                        {img.alt && <p className="text-xs truncate">{img.alt}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No images</p>
              )}
            </div>

            {/* Metadata */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <p>Created: {new Date(gallery.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p>Updated: {new Date(gallery.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
