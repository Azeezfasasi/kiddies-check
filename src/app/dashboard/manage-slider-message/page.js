'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Megaphone,
  AlertCircle,
  Info,
  CheckCircle,
  GripVertical,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import toast from 'react-hot-toast';

const ICON_OPTIONS = [
  { value: 'megaphone', label: 'Megaphone', Icon: Megaphone },
  { value: 'alert', label: 'Alert', Icon: AlertCircle },
  { value: 'info', label: 'Info', Icon: Info },
  { value: 'check', label: 'Check', Icon: CheckCircle },
];

export default function ManageSliderMessage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    text: '',
    link: '',
    isActive: true,
    bgColor: '#1e3a8a',
    textColor: '#ffffff',
    icon: 'megaphone',
  });

  // Fetch messages
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/slider-message?all=true', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.messages) {
        const sorted = [...data.messages].sort(
          (a, b) => (a.order || 0) - (b.order || 0)
        );
        setMessages(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.text || formData.text.trim() === '') {
      toast.error('Message text is required');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `/api/slider-message/${editingId}`
        : '/api/slider-message';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingId
            ? 'Message updated successfully'
            : 'Message created successfully'
        );
        resetForm();
        await fetchMessages();
      } else {
        toast.error(data.error || 'Failed to save message');
      }
    } catch (error) {
      toast.error('Failed to save message');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (message) => {
    setFormData({
      text: message.text,
      link: message.link || '',
      isActive: message.isActive ?? true,
      bgColor: message.bgColor || '#1e3a8a',
      textColor: message.textColor || '#ffffff',
      icon: message.icon || 'megaphone',
    });
    setEditingId(message._id);
    setIsFormOpen(true);
  };

  const handleDelete = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/slider-message/${messageId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Message deleted successfully');
        await fetchMessages();
      } else {
        toast.error(data.error || 'Failed to delete message');
      }
    } catch (error) {
      toast.error('Failed to delete message');
      console.error(error);
    }
  };

  const handleToggleActive = async (message) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/slider-message/${message._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ isActive: !message.isActive }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Message ${!message.isActive ? 'activated' : 'deactivated'}`
        );
        await fetchMessages();
      } else {
        toast.error(data.error || 'Failed to update message');
      }
    } catch (error) {
      toast.error('Failed to update message');
      console.error(error);
    }
  };

  const moveMessage = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= messages.length) return;

    const newOrder = messages.map((m) => m._id);
    [newOrder[index], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[index],
    ];

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/slider-message', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reorder: true, messageIds: newOrder }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchMessages();
        toast.success('Message moved successfully');
      }
    } catch (error) {
      toast.error('Failed to move message');
    }
  };

  const resetForm = () => {
    setFormData({
      text: '',
      link: '',
      isActive: true,
      bgColor: '#1e3a8a',
      textColor: '#ffffff',
      icon: 'megaphone',
    });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const getIconComponent = (iconName) => {
    const found = ICON_OPTIONS.find((opt) => opt.value === iconName);
    return found ? found.Icon : Megaphone;
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Slider Message Manager
              </h1>
              <p className="text-gray-600 mt-2">
                Manage ticker messages that appear above the site header
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus className="w-5 h-5" />
              Add New Message
            </button>
          </div>

          {/* Messages Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {messages.length === 0 ? (
              <div className="p-8 text-center">
                <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No slider messages created yet
                </p>
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Create First Message
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Link
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Colors
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {messages.map((message, index) => {
                      const IconComponent = getIconComponent(message.icon);
                      return (
                        <tr
                          key={message._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveMessage(index, 'up')}
                                disabled={index === 0}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowUp className="w-4 h-4 text-gray-500" />
                              </button>
                              <span className="text-sm font-medium text-gray-700 w-6 text-center">
                                {index + 1}
                              </span>
                              <button
                                onClick={() => moveMessage(index, 'down')}
                                disabled={index === messages.length - 1}
                                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <ArrowDown className="w-4 h-4 text-gray-500" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <IconComponent
                                className="w-4 h-4 shrink-0"
                                style={{ color: message.bgColor }}
                              />
                              <span className="text-sm text-gray-900 font-medium line-clamp-2">
                                {message.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {message.link ? (
                              <span className="text-sm text-blue-600 truncate max-w-[150px] block">
                                {message.link}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No link
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border border-gray-200"
                                style={{
                                  backgroundColor: message.bgColor,
                                }}
                                title={`BG: ${message.bgColor}`}
                              />
                              <div
                                className="w-6 h-6 rounded border border-gray-200"
                                style={{
                                  backgroundColor: message.textColor,
                                }}
                                title={`Text: ${message.textColor}`}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleToggleActive(message)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                message.isActive
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {message.isActive ? (
                                <>
                                  <Eye className="w-3 h-3" /> Active
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3" /> Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(message)}
                                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(message._id)}
                                className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {messages.filter((m) => m.isActive).length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Live Preview
              </h2>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <div
                  className="py-2.5 px-4 overflow-hidden"
                  style={{
                    background: messages[0]?.bgColor || '#1e3a8a',
                    color: messages[0]?.textColor || '#ffffff',
                  }}
                >
                  <div className="flex animate-marquee whitespace-nowrap">
                    {messages
                      .filter((m) => m.isActive)
                      .map((msg) => {
                        const IconComponent = getIconComponent(msg.icon);
                        return (
                          <span
                            key={msg._id}
                            className="inline-flex items-center gap-2 px-6 text-sm font-medium shrink-0"
                          >
                            <IconComponent className="w-4 h-4 shrink-0 opacity-90" />
                            {msg.text}
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Modal */}
          {isFormOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingId ? 'Edit Message' : 'Add New Message'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                  {/* Message Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Message Text *
                    </label>
                    <textarea
                      name="text"
                      value={formData.text}
                      onChange={handleInputChange}
                      placeholder="e.g., New term registration is now open! Enroll your child today."
                      rows="3"
                      maxLength={300}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.text.length}/300 characters
                    </p>
                  </div>

                  {/* Link */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Link URL (optional)
                    </label>
                    <input
                      type="text"
                      name="link"
                      value={formData.link}
                      onChange={handleInputChange}
                      placeholder="e.g., /register or https://example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Icon
                    </label>
                    <div className="flex gap-3">
                      {ICON_OPTIONS.map((opt) => {
                        const Icon = opt.Icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                icon: opt.value,
                              }))
                            }
                            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                              formData.icon === opt.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="bgColor"
                          value={formData.bgColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                        />
                        <input
                          type="text"
                          name="bgColor"
                          value={formData.bgColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          name="textColor"
                          value={formData.textColor}
                          onChange={handleInputChange}
                          className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                        />
                        <input
                          type="text"
                          name="textColor"
                          value={formData.textColor}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Active (visible on site)
                      </span>
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={resetForm}
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
                      {isSaving && (
                        <Loader className="w-4 h-4 animate-spin" />
                      )}
                      {editingId ? 'Update Message' : 'Create Message'}
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

