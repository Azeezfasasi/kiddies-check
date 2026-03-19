'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchGallery, updateGallery, uploadImageToCloudinary, deleteImageFromCloudinary } from '@/app/utils/galleryApi';
import { Upload, X, Loader, ArrowLeft } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const CATEGORIES = ['learning', 'education', 'infrastructure', 'technology', 'other'];
const TAGS = ['schools', 'active', 'parents', 'teachers', 'all'];

export default function EditGalleryPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'project',
    featured: false,
    status: 'active',
    businessName: '',
    location: '',
    tags: [],
    images: [],
  });

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const data = await fetchGallery(params.id);
        setFormData(data);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return {
        ...prev,
        tags: newTags,
      };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      // Process files sequentially to avoid timeout issues
      for (const file of files) {
        try {
          const result = await uploadImageToCloudinary(file, 'rayob/gallery');

          setFormData(prev => ({
            ...prev,
            images: [...prev.images, {
              url: result?.url || result,
              publicId: result?.publicId || null,
              alt: '',
              displayOrder: prev.images.length,
            }],
          }));
        } catch (err) {
          throw new Error(`Failed to upload ${file.name}: ${err.message}`);
        }
      }

      setSuccess(`${files.length} image(s) uploaded successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || `Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (index) => {
    const imageToRemove = formData.images[index];
    
    // Delete from Cloudinary if it has a publicId
    if (imageToRemove.publicId) {
      try {
        await deleteImageFromCloudinary(imageToRemove.publicId);
      } catch (err) {
        console.error('Failed to delete from Cloudinary:', err);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (formData.images.length === 0) {
      setError('At least one image is required');
      return;
    }

    setSaving(true);

    try {
      await updateGallery(params.id, formData);
      setSuccess('Gallery updated successfully');

      setTimeout(() => {
        // router.push(`/dashboard/view-gallery/${params.id}`);
        router.push("/dashboard/all-gallery");
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update gallery');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 sm:mb-8"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Edit Gallery</h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gallery title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Gallery description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Location"
                />
              </div>
            </div>

            {/* Status and Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Featured Gallery</span>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing Images */}
            {formData.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Images ({formData.images.length})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={img.url}
                        alt={img.alt || `Image ${index + 1}`}
                        width={200}
                        height={128}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white rounded-full p-0.5 sm:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <p className="text-xs text-gray-600 mt-1">
                        {index + 1}/{formData.images.length}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add More Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop your images here, or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block mx-auto text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader className="h-4 w-4 animate-spin" />
                <span>Uploading images...</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4 sm:pt-6">
              <button
                type="submit"
                disabled={saving || uploading || formData.images.length === 0}
                className="flex-1 bg-blue-600 text-white py-2.5 px-4 text-sm sm:text-base rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-300 text-gray-800 py-2.5 px-4 text-sm sm:text-base rounded-lg font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
