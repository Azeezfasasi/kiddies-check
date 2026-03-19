'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Upload, Download, Search, Filter } from 'lucide-react';
import SubscriberRow from '../components/SubscriberRow';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { subscriberAPI, newsletterHelpers } from '@/utils/newsletter-api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function Subscribers() {
  const { addToast } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, subscriberId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, subscriber: null });
  const [viewModal, setViewModal] = useState({ isOpen: false, subscriber: null });
  const [importModal, setImportModal] = useState({ isOpen: false });
  const [importFile, setImportFile] = useState(null);

  const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'complained', label: 'Complained' },
  ];

  const fetchSubscribers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subscriberAPI.getAllSubscribers(
        page,
        20,
        statusFilter,
        searchTerm,
        [],
        localStorage.getItem('authToken')
      );

      if (response.success || Array.isArray(response.subscribers)) {
        setSubscribers(response.subscribers || response);
        setHasMore((response.pagination?.totalPages || 0) > page);
      } else {
        addToast('Failed to fetch subscribers', 'error');
      }
    } catch (error) {
      addToast('Error fetching subscribers: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, searchTerm, addToast]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleDelete = async (subscriberId) => {
    setIsLoading(true);
    try {
      const subscriber = subscribers.find(s => s._id === subscriberId);
      const response = await subscriberAPI.deleteSubscriber(
        subscriber.email,
        localStorage.getItem('authToken')
      );
      if (response.success) {
        addToast('Subscriber deleted successfully', 'success');
        fetchSubscribers();
      } else {
        addToast('Failed to delete subscriber', 'error');
      }
    } catch (error) {
      addToast('Error deleting subscriber: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
      setDeleteModal({ isOpen: false, subscriberId: null });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubscribers.length === 0) {
      addToast('No subscribers selected', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await subscriberAPI.bulkDelete(
        selectedSubscribers,
        localStorage.getItem('authToken')
      );
      if (response.success) {
        addToast(`Deleted ${selectedSubscribers.length} subscribers`, 'success');
        setSelectedSubscribers([]);
        fetchSubscribers();
      } else {
        addToast('Failed to delete subscribers', 'error');
      }
    } catch (error) {
      addToast('Error deleting subscribers: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const csv = newsletterHelpers.generateSubscriberCSV(subscribers);
      newsletterHelpers.downloadCSV(`subscribers-${new Date().toISOString().split('T')[0]}.csv`, csv);
      addToast('Subscribers exported successfully', 'success');
    } catch (error) {
      addToast('Error exporting subscribers: ' + error.message, 'error');
    }
  };

  const handleEdit = async (updatedData) => {
    setIsLoading(true);
    try {
      const response = await subscriberAPI.updateSubscriber(
        editModal.subscriber.email,
        updatedData,
        localStorage.getItem('authToken')
      );
      if (response.success) {
        addToast('Subscriber updated successfully', 'success');
        setEditModal({ isOpen: false, subscriber: null });
        fetchSubscribers();
      } else {
        addToast('Failed to update subscriber', 'error');
      }
    } catch (error) {
      addToast('Error updating subscriber: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      addToast('Please select a file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const subscribers = [];

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const emailIndex = headers.indexOf('email');
            const firstNameIndex = headers.indexOf('first name');
            const lastNameIndex = headers.indexOf('last name');

            if (emailIndex !== -1) {
              subscribers.push({
                email: values[emailIndex],
                firstName: values[firstNameIndex] || '',
                lastName: values[lastNameIndex] || '',
                tags: [],
              });
            }
          }
        }

        if (subscribers.length === 0) {
          addToast('No valid subscribers found in file', 'error');
          return;
        }

        setIsLoading(true);
        const response = await subscriberAPI.bulkImport(
          subscribers,
          localStorage.getItem('authToken')
        );

        if (response.success) {
          addToast(`Imported ${subscribers.length} subscribers`, 'success');
          setImportModal({ isOpen: false });
          setImportFile(null);
          fetchSubscribers();
        } else {
          addToast(response.message || 'Failed to import subscribers', 'error');
        }
      } catch (error) {
        addToast('Error importing subscribers: ' + error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
    <div className="space-y-6 w-fit lg:w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Users className="w-5 md:w-8 h-5 md:h-8 text-blue-600" />
            <span>Subscribers</span>
          </h1>
          <p className="text-gray-600 mt-2">Manage your newsletter subscriber list</p>
        </div>
        <div className="flex items-center space-x-2 mt-4 lg:mt-0">
          <button
            onClick={() => setImportModal({ isOpen: true })}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2 border border-gray-300"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2 border border-gray-300"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 w-fit lg:w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Stats */}
          <div className="px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600">Total Subscribers</p>
            <p className="text-lg font-semibold text-gray-900">{subscribers.length}</p>
          </div>

          {/* Selected */}
          {selectedSubscribers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              Delete {selectedSubscribers.length} Selected
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 overflow-auto">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading subscribers...</p>
          </div>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No subscribers found</p>
          <button
            onClick={() => setImportModal({ isOpen: true })}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Import subscribers</span>
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-300 max-w-[350px] lg:max-w-full lg:w-full overflow-auto mx-auto">
            <table className="w-full overflow-x-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input
                      type="checkbox"
                      checked={selectedSubscribers.length === subscribers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubscribers(subscribers.map(s => s._id));
                        } else {
                          setSelectedSubscribers([]);
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Subscriber
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Opens
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map(subscriber => (
                  <tr key={subscriber._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={selectedSubscribers.includes(subscriber._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubscribers([...selectedSubscribers, subscriber._id]);
                          } else {
                            setSelectedSubscribers(
                              selectedSubscribers.filter(id => id !== subscriber._id)
                            );
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <SubscriberRow
                      subscriber={subscriber}
                      onDelete={(id) => setDeleteModal({ isOpen: true, subscriberId: id })}
                      onEdit={(subscriber) => setEditModal({ isOpen: true, subscriber })}
                      onView={(subscriber) => setViewModal({ isOpen: true, subscriber })}
                    />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} {hasMore && '(more pages available)'}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        title="Delete Subscriber"
        onClose={() => setDeleteModal({ isOpen: false, subscriberId: null })}
        onConfirm={() => handleDelete(deleteModal.subscriberId)}
        confirmText="Delete"
        isDangerous
        isLoading={isLoading}
      >
        <p className="text-gray-700">
          Are you sure you want to delete this subscriber? This action cannot be undone.
        </p>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={viewModal.isOpen}
        title="Subscriber Details"
        onClose={() => setViewModal({ isOpen: false, subscriber: null })}
        confirmText="Close"
      >
        {viewModal.subscriber && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{viewModal.subscriber.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">First Name</p>
                <p className="font-medium text-gray-900">{viewModal.subscriber.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Last Name</p>
                <p className="font-medium text-gray-900">{viewModal.subscriber.lastName}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600">Status</p>
              <p className="font-medium text-gray-900">
                {viewModal.subscriber.subscriptionStatus}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Engagement</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Opens</p>
                  <p className="font-semibold">{viewModal.subscriber.engagementMetrics?.opens || 0}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Clicks</p>
                  <p className="font-semibold">{viewModal.subscriber.engagementMetrics?.clicks || 0}</p>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <p className="text-xs text-gray-600">Bounces</p>
                  <p className="font-semibold">{viewModal.subscriber.bounceCount || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.isOpen}
        title="Edit Subscriber"
        onClose={() => setEditModal({ isOpen: false, subscriber: null })}
        onConfirm={() => {
          if (editModal.subscriber) {
            handleEdit({
              firstName: editModal.subscriber.firstName,
              lastName: editModal.subscriber.lastName,
              subscriptionStatus: editModal.subscriber.subscriptionStatus,
              tags: editModal.subscriber.tags,
            });
          }
        }}
        confirmText="Save Changes"
        isLoading={isLoading}
      >
        {editModal.subscriber && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={editModal.subscriber.email}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editModal.subscriber.firstName}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      subscriber: {
                        ...editModal.subscriber,
                        firstName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editModal.subscriber.lastName}
                  onChange={(e) =>
                    setEditModal({
                      ...editModal,
                      subscriber: {
                        ...editModal.subscriber,
                        lastName: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editModal.subscriber.subscriptionStatus}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    subscriber: {
                      ...editModal.subscriber,
                      subscriptionStatus: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Tags
              </label>
              <div className="space-y-2">
                {['vip', 'active', 'engaged', 'new'].map(tag => (
                  <label key={tag} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editModal.subscriber.tags?.includes(tag) || false}
                      onChange={(e) => {
                        const tags = editModal.subscriber.tags || [];
                        setEditModal({
                          ...editModal,
                          subscriber: {
                            ...editModal.subscriber,
                            tags: e.target.checked
                              ? [...tags, tag]
                              : tags.filter(t => t !== tag),
                          },
                        });
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Import Modal */}
      <Modal
        isOpen={importModal.isOpen}
        title="Import Subscribers"
        onClose={() => {
          setImportModal({ isOpen: false });
          setImportFile(null);
        }}
        onConfirm={handleImport}
        confirmText="Import"
        isLoading={isLoading}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with columns: Email, First Name, Last Name
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {importFile && (
            <p className="text-sm text-green-600">
              Selected file: {importFile.name}
            </p>
          )}
        </div>
      </Modal>
    </div>
    </ProtectedRoute>
  );
}
