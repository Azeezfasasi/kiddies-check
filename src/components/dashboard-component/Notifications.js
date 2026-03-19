'use client';

import React from 'react';
import useNotifications from './useNotifications';

export default function Notifications() {
  const { notifications, unreadCount, loading, error } = useNotifications();

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            {unreadCount} pending
          </span>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <p className="mt-2 text-gray-600">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">No pending notifications</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="p-4 hover:bg-gray-50 transition cursor-pointer border-l-4 border-blue-900"
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{notification.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-sm text-gray-400 mt-2">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
