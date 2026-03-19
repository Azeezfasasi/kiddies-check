'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, ChevronDown, Grid3x3, List, Heart, Eye, MapPin, Building2, Tag } from 'lucide-react';
import Link from 'next/link';

export default function Gallery() {
  const [galleries, setGalleries] = useState([]);
  const [filteredGalleries, setFilteredGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [likedGalleries, setLikedGalleries] = useState(new Set());

  const CATEGORIES = [
    { value: 'all', label: 'All Categories' },
    { value: 'education', label: 'Education' },
    { value: 'learning', label: 'Learning' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'technology', label: 'Technology' },
  ];

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery?status=active&limit=100');
      if (!response.ok) throw new Error('Failed to fetch galleries');
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Get galleries from the correct response structure
      const galleryList = data.galleries || data.data || [];
      
      // Filter only active galleries and sort featured to top
      const activeGalleries = galleryList.filter(g => g.status === 'active');
      const sortedGalleries = activeGalleries.sort((a, b) => {
        if (a.featured === b.featured) return 0;
        return a.featured ? -1 : 1;
      });
      
      console.log('Fetched galleries:', sortedGalleries);
      setGalleries(sortedGalleries);
      setFilteredGalleries(sortedGalleries);
    } catch (error) {
      console.error('Failed to fetch galleries:', error);
      setGalleries([]);
      setFilteredGalleries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = galleries;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(g => g.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query) ||
        g.businessName?.toLowerCase().includes(query) ||
        g.location?.toLowerCase().includes(query) ||
        g.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredGalleries(filtered);
  }, [searchQuery, selectedCategory, galleries]);

  const toggleLike = (galleryId) => {
    setLikedGalleries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(galleryId)) {
        newSet.delete(galleryId);
      } else {
        newSet.add(galleryId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading galleries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-4">
            Our Gallery
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg max-w-2xl">
            Explore our collection of projects, engineering works, and professional services. Browse through our featured galleries and discover our latest achievements.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search galleries by name, location, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            />
          </div>

          {/* Category Filter & View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent appearance-none pr-10"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 sm:p-2.5 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 sm:p-2.5 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm sm:text-base text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredGalleries.length}</span> galleries
          </p>
          {filteredGalleries.length === 0 && (
            <p className="text-sm text-gray-500">No galleries found. Try adjusting your filters.</p>
          )}
        </div>

        {/* Gallery Grid/List View */}
        {filteredGalleries.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredGalleries.map((gallery) => (
                  <Link href={`/gallery/${gallery._id}`} key={gallery._id}>
                    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
                      {/* Image Container */}
                      <div className="relative overflow-hidden bg-gray-200 h-48 sm:h-56">
                        {gallery.images && gallery.images.length > 0 ? (
                          <Image
                            src={gallery.images[0].url}
                            alt={gallery.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-gray-600" />
                          </div>
                        )}

                        {/* Featured Badge */}
                        {gallery.featured && (
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-yellow-400 text-yellow-900 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1">
                            ⭐ Featured
                          </div>
                        )}

                        {/* Image Count */}
                        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black bg-opacity-70 text-white px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium">
                          {gallery.images?.length || 0} images
                        </div>

                        {/* Like Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleLike(gallery._id);
                          }}
                          className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all"
                        >
                          <Heart
                            className={`h-5 w-5 transition-colors ${
                              likedGalleries.has(gallery._id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-600'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3 sm:p-4 flex flex-col grow">
                        <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-900">
                          {gallery.title}
                        </h3>

                        {/* Category Badge */}
                        <div className="mb-2 sm:mb-3">
                          <span className="inline-block bg-blue-50 text-blue-900 text-xs px-2 py-0.5 rounded-full">
                            {gallery.category}
                          </span>
                        </div>

                        {/* Description */}
                        {gallery.description && (
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                            {gallery.description}
                          </p>
                        )}

                        {/* Info */}
                        <div className="space-y-1.5 sm:space-y-2 mt-auto text-xs sm:text-sm">
                          {gallery.businessName && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Building2 className="h-4 w-4 shrink-0 text-blue-900" />
                              <span className="truncate">{gallery.businessName}</span>
                            </div>
                          )}
                          {gallery.location && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <MapPin className="h-4 w-4 shrink-0 text-red-600" />
                              <span className="truncate">{gallery.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        {gallery.tags && gallery.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {gallery.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                            {gallery.tags.length > 2 && (
                              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                                +{gallery.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* View Stats */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                          <Eye className="h-4 w-4" />
                          <span>{gallery.viewCount || 0} views</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-3 sm:space-y-4">
                {filteredGalleries.map((gallery) => (
                  <Link href={`/gallery/${gallery._id}`} key={gallery._id}>
                    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 cursor-pointer flex gap-4 sm:gap-6">
                      {/* Image */}
                      <div className="relative w-24 sm:w-32 h-24 sm:h-32 shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        {gallery.images && gallery.images.length > 0 ? (
                          <Image
                            src={gallery.images[0].url}
                            alt={gallery.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                            <Building2 className="h-8 w-8 text-gray-600" />
                          </div>
                        )}
                        {gallery.featured && (
                          <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1">
                            ⭐
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-blue-900 truncate">
                              {gallery.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="inline-block bg-blue-50 text-blue-900 text-xs px-2 py-0.5 rounded capitalize">
                                {gallery.category}
                              </span>
                              {gallery.featured && (
                                <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleLike(gallery._id);
                            }}
                            className="shrink-0 p-2"
                          >
                            <Heart
                              className={`h-5 w-5 transition-colors ${
                                likedGalleries.has(gallery._id)
                                  ? 'fill-red-500 text-red-500'
                                  : 'text-gray-400'
                              }`}
                            />
                          </button>
                        </div>

                        {gallery.description && (
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                            {gallery.description}
                          </p>
                        )}

                        {/* Info Row */}
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                          {gallery.businessName && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-blue-900" />
                              <span>{gallery.businessName}</span>
                            </div>
                          )}
                          {gallery.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-red-600" />
                              <span>{gallery.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Tags & Stats */}
                        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex gap-1">
                            {gallery.tags?.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {gallery.tags && gallery.tags.length > 3 && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                +{gallery.tags.length - 3}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Eye className="h-4 w-4" />
                            <span>{gallery.viewCount || 0} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          // Empty State
          <div className="text-center py-12 sm:py-16">
            <Building2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No galleries found</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Try adjusting your search filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="inline-block bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
