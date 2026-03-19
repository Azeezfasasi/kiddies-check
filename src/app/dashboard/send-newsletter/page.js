'use client';

import React, { useState } from 'react';
import { Send, Clock, Users, Sparkles } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { campaignAPI } from '@/utils/newsletter-api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const RECIPIENT_TYPES = [
  { value: 'all', label: 'All Active Subscribers' },
  { value: 'tags', label: 'Specific Tags' },
  { value: 'segment', label: 'Segment' },
];

const CAMPAIGN_TYPES = [
  { value: 'promotional', label: '📢 Promotional' },
  { value: 'informational', label: '📰 Informational' },
  { value: 'transactional', label: '💳 Transactional' },
  { value: 'announcement', label: '📣 Announcement' },
];

export default function SendNewsletter() {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    recipientType: 'all',
    tags: [],
    segment: '',
    type: 'informational',
    scheduledFor: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed: ${name} = "${value}" (length: ${value.length})`);
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const validateForm = () => {
    if (!formData.subject.trim()) {
      addToast('Please enter a subject', 'error');
      return false;
    }
    if (!formData.content.trim()) {
      addToast('Please enter campaign content', 'error');
      return false;
    }
    if (formData.recipientType === 'tags' && formData.tags.length === 0) {
      addToast('Please select at least one tag', 'error');
      return false;
    }
    return true;
  };

  const handleSendNow = async () => {
    if (!validateForm()) return;

    console.log('📝 FormData before sending:', {
      subject: formData.subject,
      contentLength: formData.content.length,
      content: formData.content,
    });

    setIsLoading(true);
    try {
      // First create the campaign
      const campaignPayload = {
        title: formData.subject,
        subject: formData.subject,
        content: formData.content,
        htmlContent: formData.content,
        campaignType: formData.type,
        recipients: {
          type: formData.recipientType,
          selectedTags: formData.recipientType === 'tags' ? formData.tags : [],
          selectedSegments: formData.recipientType === 'segment' ? [formData.segment] : [],
          selectedSubscribers: [],
        },
      };

      console.log('📤 Campaign payload being sent:', campaignPayload);

      const createResponse = await campaignAPI.create(
        campaignPayload,
        localStorage.getItem('authToken')
      );

      if (!createResponse.success || !createResponse.campaign?._id) {
        addToast('Failed to create campaign', 'error');
        setIsLoading(false);
        return;
      }

      const campaignId = createResponse.campaign._id;

      // Then send the campaign
      const sendResponse = await campaignAPI.send(
        campaignId,
        localStorage.getItem('authToken')
      );

      if (sendResponse.success) {
        addToast('Newsletter sent successfully!', 'success');
        setFormData({
          subject: '',
          content: '',
          recipientType: 'all',
          tags: [],
          segment: '',
          type: 'informational',
          scheduledFor: '',
        });
      } else {
        addToast(sendResponse.message || 'Failed to send newsletter', 'error');
      }
    } catch (error) {
      addToast('Error sending newsletter: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!validateForm()) return;
    if (!formData.scheduledFor) {
      addToast('Please select a date and time', 'error');
      return;
    }

    console.log('📝 FormData before scheduling:', {
      subject: formData.subject,
      contentLength: formData.content.length,
      content: formData.content,
    });

    setIsLoading(true);
    try {
      // First create the campaign
      const campaignPayload = {
        title: formData.subject,
        subject: formData.subject,
        content: formData.content,
        htmlContent: formData.content,
        campaignType: formData.type,
        recipients: {
          type: formData.recipientType,
          selectedTags: formData.recipientType === 'tags' ? formData.tags : [],
          selectedSegments: formData.recipientType === 'segment' ? [formData.segment] : [],
          selectedSubscribers: [],
        },
      };

      console.log('📤 Campaign payload being sent:', campaignPayload);

      const createResponse = await campaignAPI.create(
        campaignPayload,
        localStorage.getItem('authToken')
      );

      if (!createResponse.success || !createResponse.campaign?._id) {
        addToast('Failed to create campaign', 'error');
        setIsLoading(false);
        return;
      }

      const campaignId = createResponse.campaign._id;

      // Then schedule the campaign
      const scheduleResponse = await campaignAPI.schedule(
        campaignId,
        formData.scheduledFor,
        localStorage.getItem('authToken')
      );

      if (scheduleResponse.success) {
        addToast('Newsletter scheduled successfully!', 'success');
        setShowScheduleModal(false);
        setFormData({
          subject: '',
          content: '',
          recipientType: 'all',
          tags: [],
          segment: '',
          type: 'informational',
          scheduledFor: '',
        });
      } else {
        addToast(scheduleResponse.message || 'Failed to schedule newsletter', 'error');
      }
    } catch (error) {
      addToast('Error scheduling newsletter: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] md:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <Send className="w-5 md:w-8 h-5 md:h-8 text-blue-600" />
          <span>Send Newsletter</span>
        </h1>
        <p className="text-gray-600 mt-2">Create and send newsletters to your subscribers</p>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-4">
              Campaign Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CAMPAIGN_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.type === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-[16px] md:text-lg">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-900 mb-2">
              Subject Line *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter newsletter subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-2">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter newsletter content (supports HTML)"
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recipients */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Recipients</span>
            </h3>
            <div className="space-y-3">
              {RECIPIENT_TYPES.map(type => (
                <label key={type.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientType"
                    value={type.value}
                    checked={formData.recipientType === type.value}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>

            {/* Tags Selection */}
            {formData.recipientType === 'tags' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-3">Select tags:</p>
                <div className="space-y-2">
                  {['vip', 'active', 'engaged', 'new'].map(tag => (
                    <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Segment Selection */}
            {formData.recipientType === 'segment' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  name="segment"
                  value={formData.segment}
                  onChange={handleChange}
                  placeholder="Enter segment name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
            <button
              onClick={handleSendNow}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isLoading ? 'Sending...' : 'Send Now'}</span>
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>Schedule</span>
            </button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Pro Tip</p>
                <ul className="text-xs text-blue-800 mt-2 space-y-1">
                  <li>• Use engaging subject lines</li>
                  <li>• Keep content concise</li>
                  <li>• Test before sending</li>
                  <li>• Schedule for optimal times</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        title="Schedule Newsletter"
        onClose={() => setShowScheduleModal(false)}
        onConfirm={handleSchedule}
        confirmText="Schedule"
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choose when you want this newsletter to be sent.
          </p>
          <div>
            <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-900 mb-2">
              Date & Time
            </label>
            <input
              type="datetime-local"
              id="scheduledFor"
              name="scheduledFor"
              value={formData.scheduledFor}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
    </ProtectedRoute>
  );
}
