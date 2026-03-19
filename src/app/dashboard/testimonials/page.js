'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedTestimonialId, setExpandedTestimonialId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    message: '',
    rating: 5,
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch('/api/testimonials');
      const data = await response.json();

      if (data.success && data.testimonials) {
        const sortedTestimonials = [...data.testimonials].sort((a, b) => (a.order || 0) - (b.order || 0));
        setTestimonials(sortedTestimonials);
      }
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
      toast.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.position || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/testimonials` : '/api/testimonials';
      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? { testimonialId: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingId ? 'Testimonial updated successfully' : 'Testimonial created successfully');
        handleCloseForm();
        await fetchTestimonials();
      } else {
        toast.error(data.error || 'Failed to save testimonial');
      }
    } catch (error) {
      toast.error('Failed to save testimonial');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (testimonial) => {
    setFormData({
      name: testimonial.name,
      position: testimonial.position,
      message: testimonial.message,
      rating: testimonial.rating || 5,
    });
    setEditingId(testimonial._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (testimonialId) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const response = await fetch(`/api/testimonials?id=${testimonialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Testimonial deleted successfully');
        await fetchTestimonials();
      } else {
        toast.error(data.error || 'Failed to delete testimonial');
      }
    } catch (error) {
      toast.error('Failed to delete testimonial');
      console.error(error);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      position: '',
      message: '',
      rating: 5,
    });
  };

  const moveTestimonial = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= testimonials.length) return;

    const newOrder = testimonials.map((t) => t._id);
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      const response = await fetch('/api/testimonials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, testimonialIds: newOrder }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchTestimonials();
        toast.success('Testimonial moved successfully');
      }
    } catch (error) {
      toast.error('Failed to move testimonial');
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Testimonials Manager</h1>
              <p className="text-gray-600 mt-2">Manage client testimonials and reviews</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-5 h-5" />
              Add Testimonial
            </button>
          </div>

          {/* Testimonials List */}
          <div className="space-y-4">
            {testimonials.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No testimonials created yet</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add First Testimonial
                </button>
              </div>
            ) : (
              testimonials.map((testimonial, index) => (
                <div key={testimonial._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div
                    className="p-6 flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedTestimonialId(expandedTestimonialId === testimonial._id ? null : testimonial._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{testimonial.name}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{testimonial.position}</p>
                          <div className="flex gap-0.5 text-yellow-500 mt-2">
                            {[...Array(testimonial.rating || 5)].map((_, i) => (
                              <Star key={i} size={14} fill="currentColor" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">"{testimonial.message}"</p>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0">
                      {expandedTestimonialId === testimonial._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {expandedTestimonialId === testimonial._id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                      {/* Full Message */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Full Message</p>
                        <p className="text-sm text-gray-700 italic bg-white p-4 rounded border border-gray-200">
                          "{testimonial.message}"
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-4 border-t border-gray-200">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleEdit(testimonial)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium flex-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(testimonial._id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>

                        {/* Move buttons */}
                        {testimonials.length > 1 && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveTestimonial(index, 'up')}
                              disabled={index === 0}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              <ArrowUp className="w-4 h-4" />
                              Up
                            </button>
                            <button
                              onClick={() => moveTestimonial(index, 'down')}
                              disabled={index === testimonials.length - 1}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              <ArrowDown className="w-4 h-4" />
                              Down
                            </button>
                          </div>
                        )}

                        {/* Order indicator */}
                        <div className="text-xs text-gray-500 text-center py-1">
                          Testimonial {index + 1} of {testimonials.length}
                        </div>
                      </div>
                    </div>
                  )}
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
                    {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
                  </h2>
                  <button
                    onClick={handleCloseForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                  {/* Client Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., John Adewale"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Position/Title *
                    </label>
                    <input
                      type="text"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      placeholder="e.g., Project Manager, Alpha Industries"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Testimonial Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="What did the client say about your service?"
                      rows="5"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rating (Stars)
                    </label>
                    <select
                      name="rating"
                      value={formData.rating}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value={4}>⭐⭐⭐⭐ 4 Stars</option>
                      <option value={3}>⭐⭐⭐ 3 Stars</option>
                      <option value={2}>⭐⭐ 2 Stars</option>
                      <option value={1}>⭐ 1 Star</option>
                    </select>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCloseForm}
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving && <Loader className="w-4 h-4 animate-spin" />}
                      {editingId ? 'Update Testimonial' : 'Create Testimonial'}
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
