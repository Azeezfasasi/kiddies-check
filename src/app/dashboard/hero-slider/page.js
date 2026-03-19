'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Loader, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { uploadImageToCloudinary } from '@/app/utils/galleryApi';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

export default function HeroSliderManager() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [draggingId, setDraggingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaHref: '',
    image: '',
    alt: '',
    active: true,
  });

  // Fetch slides
  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const response = await fetch('/api/hero');
      const data = await response.json();
      
      if (data.success && data.slides) {
        const sortedSlides = [...data.slides].sort((a, b) => (a.order || 0) - (b.order || 0));
        setSlides(sortedSlides);
      }
    } catch (error) {
      console.error('Failed to fetch slides:', error);
      toast.error('Failed to load slides');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const result = await uploadImageToCloudinary(file, 'rayob/hero-slider');
      setFormData(prev => ({
        ...prev,
        image: result.url,
        alt: prev.alt || 'Hero slide image',
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Hero slider image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.subtitle || !formData.ctaLabel || !formData.ctaHref || !formData.image) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const url = editingId ? `/api/hero?id=${editingId}` : '/api/hero';
      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? { slideId: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingId ? 'Slide updated successfully' : 'Slide created successfully');
        setFormData({
          title: '',
          subtitle: '',
          ctaLabel: '',
          ctaHref: '',
          image: '',
          alt: '',
          active: true,
        });
        setEditingId(null);
        setIsFormOpen(false);
        await fetchSlides();
      } else {
        toast.error(data.error || 'Failed to save slide');
      }
    } catch (error) {
      toast.error('Failed to save slide');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (slide) => {
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      ctaLabel: slide.ctaLabel,
      ctaHref: slide.ctaHref,
      image: slide.image,
      alt: slide.alt || '',
      active: slide.active ?? true,
    });
    setEditingId(slide._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (slideId) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;

    try {
      const response = await fetch(`/api/hero?id=${slideId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Slide deleted successfully');
        await fetchSlides();
      } else {
        toast.error(data.error || 'Failed to delete slide');
      }
    } catch (error) {
      toast.error('Failed to delete slide');
      console.error(error);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      subtitle: '',
      ctaLabel: '',
      ctaHref: '',
      image: '',
      alt: '',
      active: true,
    });
  };

  const moveSlide = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const newOrder = slides.map((s, i) => s._id);
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      const response = await fetch('/api/hero', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, slideIds: newOrder }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchSlides();
        toast.success('Slide moved successfully');
      }
    } catch (error) {
      toast.error('Failed to move slide');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Hero Slider Manager</h1>
              <p className="text-gray-600 mt-2">Manage your hero section slides and content</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-5 h-5" />
              Add New Slide
            </button>
          </div>

          {/* Slides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {slides.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No slides created yet</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Create First Slide
                </button>
              </div>
            ) : (
              slides.map((slide, index) => (
                <div key={slide._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Slide Image Preview */}
                  <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
                    {slide.image ? (
                      <Image
                        src={slide.image}
                        alt={slide.alt || 'Slide'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Upload className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Slide Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{slide.title}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{slide.subtitle}</p>

                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">CTA:</span> {slide.ctaLabel}
                      </p>
                      <p className="text-xs text-gray-500 break-all">
                        <span className="font-semibold">URL:</span> {slide.ctaHref}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(slide)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(slide._id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>

                      {/* Move buttons */}
                      {slides.length > 1 && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => moveSlide(index, 'up')}
                            disabled={index === 0}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                          >
                            <ArrowUp className="w-4 h-4" />
                            Up
                          </button>
                          <button
                            onClick={() => moveSlide(index, 'down')}
                            disabled={index === slides.length - 1}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                          >
                            <ArrowDown className="w-4 h-4" />
                            Down
                          </button>
                        </div>
                      )}

                      {/* Order indicator */}
                      <div className="text-xs text-gray-500 text-center py-1">
                        Slide {index + 1} of {slides.length}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Slide' : 'Add New Slide'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Innovative Technology, Strategic Management!"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subtitle *
                    </label>
                    <textarea
                      name="subtitle"
                      value={formData.subtitle}
                      onChange={handleInputChange}
                      placeholder="e.g., We build robust infrastructure and technology solutions tailored to your needs."
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* CTA Label and Href */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CTA Button Label *
                      </label>
                      <input
                        type="text"
                        name="ctaLabel"
                        value={formData.ctaLabel}
                        onChange={handleInputChange}
                        placeholder="e.g., Request a Quote"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CTA URL *
                      </label>
                      <input
                        type="text"
                        name="ctaHref"
                        value={formData.ctaHref}
                        onChange={handleInputChange}
                        placeholder="e.g., /request-a-quote"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      name="alt"
                      value={formData.alt}
                      onChange={handleInputChange}
                      placeholder="Describe the image for accessibility"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Slide Image * {imageUploading && <span className="text-blue-600">(Uploading...)</span>}
                    </label>

                    {formData.image ? (
                      <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-3">
                        <Image
                          src={formData.image}
                          alt={formData.alt || 'Preview'}
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={imageUploading}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload an image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={imageUploading}
                          className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">Active</span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                      {editingId ? 'Update Slide' : 'Create Slide'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
