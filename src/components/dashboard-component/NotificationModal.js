'use client';

import React from 'react';
import Link from 'next/link';

export default function NotificationModal({ isOpen, onClose, notifications, unreadCount }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0" onClick={onClose}>
        <div 
          className="bg-white rounded-lg shadow-2xl max-w-md w-full sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-slideIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-blue-100 text-sm mt-1">
                    {unreadCount} pending {unreadCount === 1 ? 'item' : 'items'}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors duration-200"
                aria-label="Close notifications"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-center text-lg font-medium">No pending notifications</p>
                <p className="text-center text-sm mt-2">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={notification.link}
                    onClick={onClose}
                  >
                    <div className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 cursor-pointer border-l-4 border-transparent hover:border-blue-900">
                      <div className="flex items-start gap-4">
                        <div className="text-3xl flex-shrink-0">{notification.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <Link
                href="/dashboard/quote-requests"
                onClick={onClose}
                className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-800 font-semibold text-sm transition-colors duration-200"
              >
                View All Pending Items
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
