'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trash2,
  Edit,
  Send,
  Pause,
  BarChart3,
  Clock,
  Users,
  Mail,
} from 'lucide-react';

export default function NewsletterCard({ campaign, onDelete, onEdit, onSend, onPause }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'promotional':
        return 'text-purple-600';
      case 'informational':
        return 'text-blue-600';
      case 'transactional':
        return 'text-green-600';
      case 'announcement':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {campaign.subject || 'Untitled Campaign'}
            </h3>
            <p className={`text-sm font-medium mt-1 ${getTypeColor(campaign.type)}`}>
              {campaign.type?.charAt(0).toUpperCase() + campaign.type?.slice(1) || 'Standard'}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(campaign.status)}`}>
            {campaign.status?.charAt(0).toUpperCase() + campaign.status?.slice(1) || 'Unknown'}
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {campaign.content?.substring(0, 100) || 'No description'}...
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">Recipients</p>
            <p className="text-sm font-semibold text-gray-900">
              {campaign.recipientCount || 0}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-gray-600" />
          <div>
            <p className="text-xs text-gray-600">Open Rate</p>
            <p className="text-sm font-semibold text-gray-900">
              {campaign.openRate || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="px-6 py-4 space-y-2 border-b border-gray-100">
        {campaign.sentAt && (
          <div className="flex items-center space-x-2 text-sm">
            <Send className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">
              Sent: {formatDate(campaign.sentAt)}
            </span>
          </div>
        )}
        {campaign.scheduledFor && campaign.status === 'scheduled' && (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-gray-700">
              Scheduled: {formatDate(campaign.scheduledFor)}
            </span>
          </div>
        )}
        {!campaign.sentAt && !campaign.scheduledFor && (
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Not sent yet</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 flex items-center justify-between bg-gray-50">
        <Link
          href={`/dashboard/newsletter/${campaign._id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Analytics
        </Link>
        <div className="flex items-center space-x-2">
          {campaign.status === 'draft' && (
            <>
              <button
                onClick={() => onEdit(campaign)}
                className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onSend(campaign._id)}
                className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          )}
          {campaign.status === 'scheduled' && (
            <button
              onClick={() => onPause(campaign._id)}
              className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors"
              title="Pause"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(campaign._id)}
            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
