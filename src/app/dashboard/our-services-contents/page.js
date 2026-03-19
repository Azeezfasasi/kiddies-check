'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

const COLORS = [
  'from-indigo-600 to-indigo-700',
  'from-blue-600 to-blue-700',
  'from-orange-600 to-orange-700',
  'from-green-600 to-green-700',
  'from-pink-600 to-pink-700',
  'from-yellow-600 to-yellow-700',
  'from-teal-600 to-teal-700',
  'from-red-600 to-red-700',
  'from-purple-600 to-purple-700',
  'from-cyan-600 to-cyan-700',
];

export default function OurServicesContentsManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedServiceId, setExpandedServiceId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    shortDesc: '',
    icon: '',
    color: 'from-blue-600 to-blue-700',
    details: [],
    images: [],
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      
      if (data.success && data.services) {
        const sortedServices = [...data.services].sort((a, b) => (a.order || 0) - (b.order || 0));
        setServices(sortedServices);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.shortDesc) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/services` : '/api/services';
      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? { serviceId: editingId, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingId ? 'Service updated successfully' : 'Service created successfully');
        handleCloseForm();
        await fetchServices();
      } else {
        toast.error(data.error || 'Failed to save service');
      }
    } catch (error) {
      toast.error('Failed to save service');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setFormData({
      title: service.title,
      shortDesc: service.shortDesc,
      icon: service.icon || '',
      color: service.color || 'from-blue-600 to-blue-700',
      details: service.details || [],
      images: service.images || [],
    });
    setEditingId(service._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/services?id=${serviceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Service deleted successfully');
        await fetchServices();
      } else {
        toast.error(data.error || 'Failed to delete service');
      }
    } catch (error) {
      toast.error('Failed to delete service');
      console.error(error);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      shortDesc: '',
      icon: '',
      color: 'from-blue-600 to-blue-700',
      details: [],
      images: [],
    });
  };

  const moveService = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= services.length) return;

    const newOrder = services.map((s) => s._id);
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      const response = await fetch('/api/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, serviceIds: newOrder }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchServices();
        toast.success('Service moved successfully');
      }
    } catch (error) {
      toast.error('Failed to move service');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (!files.length) return;

    toast.promise(
      Promise.all(files.map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              const response = await fetch('/api/cloudinary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileData: event.target.result,
                  folderName: 'rayob/services',
                }),
              });

              const data = await response.json();

              if (data.success) {
                setFormData(prev => ({
                  ...prev,
                  images: [...(prev.images || []), {
                    url: data.url,
                    publicId: data.publicId,
                    alt: file.name.split('.')[0],
                    order: (prev.images || []).length,
                  }],
                }));
                resolve();
              } else {
                reject(new Error(data.error || 'Upload failed'));
              }
            } catch (error) {
              reject(error);
            }
          };
          reader.readAsDataURL(file);
        });
      })),
      {
        loading: 'Uploading images...',
        success: 'Images uploaded successfully!',
        error: 'Failed to upload images',
      }
    );
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Our Services Manager</h1>
              <p className="text-gray-600 mt-2">Manage your services and content</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-5 h-5" />
              Add New Service
            </button>
          </div>

          {/* Services List */}
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No services created yet</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Create First Service
                </button>
              </div>
            ) : (
              services.map((service, index) => (
                <div key={service._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div
                    className="p-6 flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedServiceId(expandedServiceId === service._id ? null : service._id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className={`bg-gradient-to-br ${service.color || 'from-blue-600 to-blue-700'} w-12 h-12 rounded-lg flex-shrink-0`} />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                          <p className="text-sm text-gray-600">{service.shortDesc}</p>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 ml-4">
                      {expandedServiceId === service._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {expandedServiceId === service._id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Details: {service.details?.length || 0} sections</p>
                        {service.details && service.details.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {service.details.map((detail, idx) => (
                              <div key={idx} className="text-sm bg-white p-2 rounded border border-gray-200">
                                {detail.section && <p className="font-semibold text-gray-900">{detail.section}</p>}
                                {detail.text && <p className="text-gray-600 line-clamp-2">{detail.text}</p>}
                                {detail.items && <p className="text-gray-600">{detail.items.length} items</p>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-4 border-t border-gray-200">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleEdit(service)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium flex-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(service._id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>

                        {/* Move buttons */}
                        {services.length > 1 && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveService(index, 'up')}
                              disabled={index === 0}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              <ArrowUp className="w-4 h-4" />
                              Up
                            </button>
                            <button
                              onClick={() => moveService(index, 'down')}
                              disabled={index === services.length - 1}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              <ArrowDown className="w-4 h-4" />
                              Down
                            </button>
                          </div>
                        )}

                        {/* Order indicator */}
                        <div className="text-xs text-gray-500 text-center py-1">
                          Service {index + 1} of {services.length}
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
                    {editingId ? 'Edit Service' : 'Add New Service'}
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
                      Service Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Engineering Services"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Short Description *
                    </label>
                    <textarea
                      name="shortDesc"
                      value={formData.shortDesc}
                      onChange={handleInputChange}
                      placeholder="Brief description that appears on the services card"
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Icon Name
                    </label>
                    <input
                      type="text"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                      placeholder="e.g., engineering services"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Used to select the appropriate icon for this service</p>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Color Theme
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-full h-12 rounded-lg border-2 transition-all ${
                            formData.color === color
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                          style={{ background: color === formData.color ? `linear-gradient(to right, ${color})` : `` }}
                        >
                          <div className={`w-full h-full rounded-[5px] bg-gradient-to-br ${color}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Images */}
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                      Service Images
                    </label>

                    {/* Upload Area */}
                    <div className="mb-4">
                      <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition bg-gray-50 hover:bg-gray-100">
                        <Upload className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Click to upload images</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">Supported formats: JPG, PNG, WebP, GIF. Multiple files allowed.</p>
                    </div>

                    {/* Image Gallery */}
                    {formData.images && formData.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-4">
                        {formData.images.map((image, idx) => (
                          <div key={idx} className="relative group">
                            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                              <img
                                src={image.url}
                                alt={image.alt || `Service image ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <input
                              type="text"
                              value={image.alt || ''}
                              onChange={(e) => {
                                const newImages = [...formData.images];
                                newImages[idx].alt = e.target.value;
                                setFormData(prev => ({ ...prev, images: newImages }));
                              }}
                              placeholder="Alt text"
                              className="w-full mt-2 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic text-center py-4">No images uploaded yet</p>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-semibold text-gray-700">
                        Service Details (Sections)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            details: [...(prev.details || []), { section: '', text: '', items: [] }]
                          }));
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded text-sm font-medium hover:bg-green-100 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Add Section
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.details && formData.details.length > 0 ? (
                        formData.details.map((detail, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium text-gray-900">Section {idx + 1}</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    details: prev.details.filter((_, i) => i !== idx)
                                  }));
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Section Title */}
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Section Title
                              </label>
                              <input
                                type="text"
                                value={detail.section || ''}
                                onChange={(e) => {
                                  const newDetails = [...formData.details];
                                  newDetails[idx].section = e.target.value;
                                  setFormData(prev => ({ ...prev, details: newDetails }));
                                }}
                                placeholder="e.g., Our Scope of Engineering Services"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            {/* Section Text */}
                            <div className="mb-3">
                              <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Description
                              </label>
                              <textarea
                                value={detail.text || ''}
                                onChange={(e) => {
                                  const newDetails = [...formData.details];
                                  newDetails[idx].text = e.target.value;
                                  setFormData(prev => ({ ...prev, details: newDetails }));
                                }}
                                placeholder="Main description text for this section"
                                rows="2"
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            {/* Section Items */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold text-gray-600">
                                  Bullet Points ({detail.items?.length || 0})
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDetails = [...formData.details];
                                    if (!newDetails[idx].items) {
                                      newDetails[idx].items = [];
                                    }
                                    newDetails[idx].items.push('');
                                    setFormData(prev => ({ ...prev, details: newDetails }));
                                  }}
                                  className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                                >
                                  + Add Point
                                </button>
                              </div>

                              <div className="space-y-2">
                                {detail.items && detail.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={item}
                                      onChange={(e) => {
                                        const newDetails = [...formData.details];
                                        newDetails[idx].items[itemIdx] = e.target.value;
                                        setFormData(prev => ({ ...prev, details: newDetails }));
                                      }}
                                      placeholder={`Bullet point ${itemIdx + 1}`}
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newDetails = [...formData.details];
                                        newDetails[idx].items = newDetails[idx].items.filter((_, i) => i !== itemIdx);
                                        setFormData(prev => ({ ...prev, details: newDetails }));
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No details added yet. Click "Add Section" to create formatted content sections.</p>
                      )}
                    </div>
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
                      {editingId ? 'Update Service' : 'Create Service'}
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
