'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';
import { uploadImageToCloudinary } from '@/app/utils/galleryApi';

export default function OurClientsManager() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    logoPreview: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();

      if (data.success && data.clients) {
        const sortedClients = [...data.clients].sort((a, b) => (a.order || 0) - (b.order || 0));
        setClients(sortedClients);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      toast.error('Failed to load clients');
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

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadImageToCloudinary(file, 'clients');
      setFormData(prev => ({
        ...prev,
        logo: result.url,
        logoPreview: result.url,
      }));
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.logo) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/clients` : '/api/clients';
      const method = editingId ? 'PUT' : 'POST';

      const payload = editingId
        ? { clientId: editingId, name: formData.name, logo: formData.logo }
        : { name: formData.name, logo: formData.logo };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(editingId ? 'Client updated successfully' : 'Client created successfully');
        handleCloseForm();
        await fetchClients();
      } else {
        toast.error(data.error || 'Failed to save client');
      }
    } catch (error) {
      toast.error('Failed to save client');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client) => {
    setFormData({
      name: client.name,
      logo: client.logo,
      logoPreview: client.logo,
    });
    setEditingId(client._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const response = await fetch(`/api/clients?id=${clientId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Client deleted successfully');
        await fetchClients();
      } else {
        toast.error(data.error || 'Failed to delete client');
      }
    } catch (error) {
      toast.error('Failed to delete client');
      console.error(error);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      name: '',
      logo: '',
      logoPreview: '',
    });
  };

  const moveClient = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= clients.length) return;

    const newOrder = clients.map((c) => c._id);
    [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

    try {
      const response = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: true, clientIds: newOrder }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchClients();
        toast.success('Client moved successfully');
      }
    } catch (error) {
      toast.error('Failed to move client');
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Clients & Partners Manager</h1>
              <p className="text-gray-600 mt-2">Manage your clients and partners logos</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-5 h-5" />
              Add New Client
            </button>
          </div>

          {/* Clients List */}
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No clients created yet</p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add First Client
                </button>
              </div>
            ) : (
              clients.map((client, index) => (
                <div key={client._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div
                    className="p-6 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedClientId(expandedClientId === client._id ? null : client._id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img
                          src={client.logo}
                          alt={client.name}
                          className="max-w-[90%] max-h-[90%] object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Client {index + 1} of {clients.length}</p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 ml-4">
                      {expandedClientId === client._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {expandedClientId === client._id && (
                    <div className="border-t border-gray-200 p-6 bg-gray-50 space-y-4">
                      {/* Logo Preview */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Logo Preview</p>
                        <div className="w-24 h-24 rounded-lg border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                          <img
                            src={client.logo}
                            alt={client.name}
                            className="max-w-[90%] max-h-[90%] object-contain"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-4 border-t border-gray-200">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleEdit(client)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-medium flex-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(client._id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors text-sm font-medium flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>

                        {/* Move buttons */}
                        {clients.length > 1 && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveClient(index, 'up')}
                              disabled={index === 0}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              <ArrowUp className="w-4 h-4" />
                              Up
                            </button>
                            <button
                              onClick={() => moveClient(index, 'down')}
                              disabled={index === clients.length - 1}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              <ArrowDown className="w-4 h-4" />
                              Down
                            </button>
                          </div>
                        )}
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
                    {editingId ? 'Edit Client' : 'Add New Client'}
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
                      placeholder="e.g., Huawei Technologies Limited"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Client Logo *
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                          <span className="text-sm font-medium text-gray-700">
                            {uploading ? 'Uploading...' : 'Choose Logo'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            disabled={uploading}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {formData.logoPreview && (
                        <div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                          <div className="w-32 h-32 flex items-center justify-center">
                            <img
                              src={formData.logoPreview}
                              alt="Logo preview"
                              className="max-w-[90%] max-h-[90%] object-contain"
                            />
                          </div>
                        </div>
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
                      disabled={saving || uploading}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {(saving || uploading) && <Loader className="w-4 h-4 animate-spin" />}
                      {editingId ? 'Update Client' : 'Create Client'}
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
