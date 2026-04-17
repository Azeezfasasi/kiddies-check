'use client';

import React, { useState } from 'react';
import { X, Mail, Send, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessageParentModal({ parent, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      
      // TODO: Implement actual messaging API endpoint
      // For now, we'll show a success message and log the intent
      console.log('Message would be sent to:', {
        parentId: parent._id,
        parentEmail: parent.email,
        subject,
        message,
      });

      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Message sent to ${parent.firstName} ${parent.lastName}`);
      setSubject('');
      setMessage('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Mail size={28} />
            Send Message
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipient Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">Recipient</p>
            <p className="text-lg font-semibold text-green-900">
              {parent.firstName} {parent.lastName}
            </p>
            <p className="text-sm text-green-800 mt-1">{parent.email}</p>
            {parent.phone && (
              <p className="text-sm text-green-800">{parent.phone}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) {
                  setErrors((prev) => ({ ...prev, subject: '' }));
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter message subject"
            />
            {errors.subject && (
              <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) {
                  setErrors((prev) => ({ ...prev, message: '' }));
                }
              }}
              rows="8"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none ${
                errors.message ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your message here..."
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message}</p>
            )}
            <p className="text-gray-600 text-sm mt-2">
              {message.length} characters • {message.split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          {/* Template Quick Buttons */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSubject('Attendance Reminder');
                  setMessage('Dear parent, we noticed that your child has been absent recently. Please ensure regular attendance for better academic progress.');
                }}
                className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-gray-700"
              >
                📋 Attendance Reminder
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubject('Academic Progress Update');
                  setMessage('Dear parent, we wanted to share an update on your child\'s academic progress. Please feel free to contact us if you have any questions or concerns.');
                }}
                className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-gray-700"
              >
                📚 Progress Update
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubject('Behavior Notice');
                  setMessage('Dear parent, we wanted to inform you about your child\'s recent behavior at school. Please review and discuss with your child.');
                }}
                className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-gray-700"
              >
                ⚠️ Behavior Notice
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubject('Meeting Request');
                  setMessage('Dear parent, we would like to schedule a meeting to discuss your child\'s progress and address any concerns. Please let us know your availability.');
                }}
                className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition font-medium text-gray-700"
              >
                🤝 Meeting Request
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader size={18} className="animate-spin" />}
            {loading ? 'Sending...' : 'Send Message'}
            {!loading && <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
