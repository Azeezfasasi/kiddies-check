'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Loader, ArrowUp, ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { uploadImageToCloudinary } from '@/app/utils/galleryApi';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

export default function HomeCTAManager() {
  const [content, setContent] = useState({
    title: '',
    paragraphs: [],
    image: { url: '', alt: '' },
    ctaButton: { label: '', href: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [editingParagraphId, setEditingParagraphId] = useState(null);
  const [newParagraphText, setNewParagraphText] = useState('');
  const [editingParagraphText, setEditingParagraphText] = useState('');

  // Fetch content
  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/home-about');
      const data = await response.json();
      
      if (data.success && data.data) {
        setContent(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    setContent(prev => ({ ...prev, title: e.target.value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const result = await uploadImageToCloudinary(file, 'rayob/home-about');
      setContent(prev => ({
        ...prev,
        image: {
          url: result.url || result,
          alt: prev.image?.alt || 'Home About Image',
        },
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Home CTA image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageAltChange = (e) => {
    setContent(prev => ({
      ...prev,
      image: { ...prev.image, alt: e.target.value },
    }));
  };

  const handleRemoveImage = () => {
    setContent(prev => ({ ...prev, image: { url: '', alt: '' } }));
  };

  const handleCtaLabelChange = (e) => {
    setContent(prev => ({
      ...prev,
      ctaButton: { ...prev.ctaButton, label: e.target.value },
    }));
  };

  const handleCtaHrefChange = (e) => {
    setContent(prev => ({
      ...prev,
      ctaButton: { ...prev.ctaButton, href: e.target.value },
    }));
  };

  const handleAddParagraph = async () => {
    if (!newParagraphText.trim()) {
      toast.error('Please enter paragraph text');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/home-about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addParagraph',
          text: newParagraphText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Paragraph added successfully');
        setNewParagraphText('');
        await fetchContent();
      } else {
        toast.error(data.error || 'Failed to add paragraph');
      }
    } catch (error) {
      toast.error('Failed to add paragraph');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEditParagraph = (paragraph) => {
    setEditingParagraphId(paragraph._id);
    setEditingParagraphText(paragraph.text);
  };

  const handleSaveParagraph = async (paragraphId) => {
    if (!editingParagraphText.trim()) {
      toast.error('Please enter paragraph text');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/home-about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateParagraph',
          paragraphId,
          text: editingParagraphText,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Paragraph updated successfully');
        setEditingParagraphId(null);
        setEditingParagraphText('');
        await fetchContent();
      } else {
        toast.error(data.error || 'Failed to update paragraph');
      }
    } catch (error) {
      toast.error('Failed to update paragraph');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParagraph = async (paragraphId) => {
    if (!confirm('Are you sure you want to delete this paragraph?')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/home-about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteParagraph',
          paragraphId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Paragraph deleted successfully');
        await fetchContent();
      } else {
        toast.error(data.error || 'Failed to delete paragraph');
      }
    } catch (error) {
      toast.error('Failed to delete paragraph');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMainContent = async () => {
    if (!content.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/home-about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          image: content.image,
          ctaButton: content.ctaButton,
          paragraphs: content.paragraphs,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Content saved successfully');
      } else {
        toast.error(data.error || 'Failed to save content');
      }
    } catch (error) {
      toast.error('Failed to save content');
      console.error(error);
    } finally {
      setSaving(false);
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

  const sortedParagraphs = [...content.paragraphs].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Home CTA Manager</h1>
            <p className="text-gray-600">Manage your home about section content</p>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Section Content</h2>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={content.title}
                onChange={handleTitleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="e.g., About Kiddies Check"
              />
            </div>

            {/* Image Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section Image {imageUploading && <span className="text-blue-600">(Uploading...)</span>}
              </label>

              {content.image?.url ? (
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <Image
                    src={content.image.url}
                    alt={content.image.alt || 'Section'}
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-3">
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

              <input
                type="text"
                value={content.image?.alt || ''}
                onChange={handleImageAltChange}
                placeholder="Image alt text"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* CTA Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Button Label
                </label>
                <input
                  type="text"
                  value={content.ctaButton?.label || ''}
                  onChange={handleCtaLabelChange}
                  placeholder="Learn More"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Button URL
                </label>
                <input
                  type="text"
                  value={content.ctaButton?.href || ''}
                  onChange={handleCtaHrefChange}
                  placeholder="/about-us"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSaveMainContent}
              disabled={saving}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              Save Content
            </button>
          </div>

          {/* Paragraphs Section */}
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Paragraphs</h2>

            {/* Existing Paragraphs */}
            <div className="space-y-4 mb-8">
              {sortedParagraphs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No paragraphs added yet</p>
              ) : (
                sortedParagraphs.map((para, index) => (
                  <div key={para._id} className="border border-gray-200 rounded-lg p-4">
                    {editingParagraphId === para._id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingParagraphText}
                          onChange={(e) => setEditingParagraphText(e.target.value)}
                          rows="4"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveParagraph(para._id)}
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingParagraphId(null)}
                            disabled={saving}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-xs text-gray-500">Paragraph {index + 1}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditParagraph(para)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                            >
                              <Edit2 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteParagraph(para._id)}
                              className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700">{para.text}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Paragraph */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Paragraph</h3>
              <textarea
                value={newParagraphText}
                onChange={(e) => setNewParagraphText(e.target.value)}
                placeholder="Enter paragraph text..."
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-3"
              />
              <button
                onClick={handleAddParagraph}
                disabled={saving}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Paragraph
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
