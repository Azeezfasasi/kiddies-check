'use client';

import React from 'react';
import { Mail, Trash2, Edit, Eye } from 'lucide-react';

export default function SubscriberRow({ subscriber, onDelete, onEdit, onView }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      case 'complained':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {subscriber.firstName} {subscriber.lastName}
            </p>
            <p className="text-xs text-gray-600">{subscriber.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            subscriber.subscriptionStatus
          )}`}
        >
          {subscriber.subscriptionStatus?.charAt(0).toUpperCase() +
            subscriber.subscriptionStatus?.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {subscriber.tags?.join(', ') || 'No tags'}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {subscriber.engagementMetrics?.opens || 0}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {subscriber.engagementMetrics?.clicks || 0}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">
        {formatDate(subscriber.subscribedAt)}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onView(subscriber)}
            className="p-1 hover:bg-blue-50 rounded text-blue-600 transition-colors"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(subscriber)}
            className="p-1 hover:bg-gray-100 rounded text-gray-600 transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(subscriber._id)}
            className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </>
  );
}
