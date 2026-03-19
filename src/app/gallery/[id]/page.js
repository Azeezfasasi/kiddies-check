'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, MapPin, Building2, Tag, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function GalleryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gallery/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch gallery');
      
      const data = await response.json();
      console.log('Gallery data:', data);
      
      // Handle different response structures
      const galleryData = data.gallery || data.data || data;
      setGallery(galleryData);
      setError('');
    } catch (err) {
      console.error('Error fetching gallery:', err);
      setError(err.message || 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchGallery();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const nextImage = () => {
    if (gallery?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % gallery.images.length);
    }
  };

  const prevImage = () => {
    if (gallery?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + gallery.images.length) % gallery.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-8 font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            Back
          </button>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-red-600 font-medium mb-4">{error || 'Gallery not found'}</p>
            <button
              onClick={() => router.push('/gallery')}
              className="inline-block bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Galleries
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentImage = gallery.images?.[currentImageIndex];
  const categoryLabel = gallery.category?.charAt(0).toUpperCase() + gallery.category?.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-6 sm:mb-8 font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Image Carousel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Image Container */}
              <div className="relative bg-gray-200 aspect-video sm:aspect-auto sm:h-96">
                {currentImage ? (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || gallery.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-gray-600" />
                  </div>
                )}

                {/* Navigation Arrows */}
                {gallery.images && gallery.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all shadow-md"
                    >
                      <ChevronLeft className="h-6 w-6 text-gray-900" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all shadow-md"
                    >
                      <ChevronRight className="h-6 w-6 text-gray-900" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {gallery.images && gallery.images.length > 1 && (
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} / {gallery.images.length}
                  </div>
                )}

                {/* Featured Badge */}
                {gallery.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm sm:text-base font-bold flex items-center gap-2">
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Thumbnail Carousel */}
              {gallery.images && gallery.images.length > 1 && (
                <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {gallery.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`shrink-0 relative w-16 sm:w-20 h-16 sm:h-20 rounded-lg overflow-hidden transition-all ${
                          idx === currentImageIndex
                            ? 'ring-2 ring-blue-900 shadow-md'
                            : 'opacity-70 hover:opacity-100 ring-1 ring-gray-300'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Section */}
            {gallery.description && (
              <div className="mt-6 sm:mt-8 bg-white rounded-lg p-4 sm:p-6 shadow-md">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">About This Gallery</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {gallery.description}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Title & Basic Info */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {gallery.title}
                  </h1>
                  {categoryLabel && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs sm:text-sm px-3 py-1 rounded-full font-medium">
                      {categoryLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-wrap gap-2 mb-4">
                {gallery.status && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                      gallery.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {gallery.status === 'active' ? '✓ Active' : '✗ Inactive'}
                  </span>
                )}
              </div>

              {/* Like & Share Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setLiked(!liked)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
                    liked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
                  <span className="text-sm">{liked ? 'Liked' : 'Like'}</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                  <Share2 className="h-5 w-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>

              {/* View Count */}
              <div className="text-sm text-gray-600 text-center py-2 border-t border-gray-200">
                {gallery.viewCount || 0} views
              </div>
            </div>

            {/* Business & Location */}
            {(gallery.businessName || gallery.location) && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Details</h3>
                <div className="space-y-3">
                  {gallery.businessName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-blue-900 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Business</p>
                        <p className="text-sm sm:text-base text-gray-900 font-semibold wrap-break-word">
                          {gallery.businessName}
                        </p>
                      </div>
                    </div>
                  )}
                  {gallery.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Location</p>
                        <p className="text-sm sm:text-base text-gray-900 font-semibold wrap-break-word">
                          {gallery.location}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {gallery.tags && gallery.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {gallery.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs sm:text-sm px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Galleries Section */}
        <div className="mt-12 sm:mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Browse More Galleries</h2>
          <button
            onClick={() => router.push('/gallery')}
            className="inline-block bg-blue-900 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
          >
            View All Galleries →
          </button>
        </div>
      </div>
    </div>
  );
}
