'use client';

import React from 'react';
import { X, Mail, Phone, Calendar, Award } from 'lucide-react';

export default function ParentDetailsModal({ parent, onClose }) {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Parent Details</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-start gap-4 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {parent.firstName.charAt(0)}
              {parent.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">
                {parent.firstName} {parent.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    parent.isActive !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {parent.isActive !== false ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="text-blue-600" size={20} />
              Contact Information
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900 break-all">{parent.email}</p>
              </div>
              {parent.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <p className="text-gray-900">{parent.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          {(parent.company || parent.department || parent.position) && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="text-blue-600" size={20} />
                Professional Information
              </h4>
              <div className="space-y-3">
                {parent.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Company</label>
                    <p className="text-gray-900">{parent.company}</p>
                  </div>
                )}
                {parent.department && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Department</label>
                    <p className="text-gray-900">{parent.department}</p>
                  </div>
                )}
                {parent.position && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Position</label>
                    <p className="text-gray-900">{parent.position}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Account Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Member Since</label>
                <p className="text-gray-900">{formatDate(parent.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Login</label>
                <p className="text-gray-900">{parent.lastLogin ? formatDate(parent.lastLogin) : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
