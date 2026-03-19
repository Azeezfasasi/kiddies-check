'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search, BarChart3, Archive } from 'lucide-react';
import Link from 'next/link';
import NewsletterCard from '../components/NewsletterCard';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { campaignAPI } from '@/utils/newsletter-api';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AllNewsletter() {
  const { addToast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, campaignId: null });
  const [editModal, setEditModal] = useState({ isOpen: false, campaign: null });

  const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'sent', label: 'Sent' },
    { value: 'paused', label: 'Paused' },
  ];

  const TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'informational', label: 'Informational' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'announcement', label: 'Announcement' },
  ];

  const fetchCampaigns = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await campaignAPI.getAll(
        statusFilter !== 'all' ? statusFilter : '',
        page,
        20,
        searchTerm,
        localStorage.getItem('authToken')
      );

      if (response.success || Array.isArray(response.campaigns)) {
        setCampaigns(response.campaigns || response);
        setHasMore((response.pagination?.totalPages || 0) > page);
      } else {
        addToast('Failed to fetch campaigns', 'error');
      }
    } catch (error) {
      addToast('Error fetching campaigns: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page, searchTerm, addToast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (campaignId) => {
    setIsLoading(true);
    try {
      const response = await campaignAPI.delete(campaignId, localStorage.getItem('authToken'));
      if (response.success) {
        addToast('Campaign deleted successfully', 'success');
        fetchCampaigns();
      } else {
        addToast('Failed to delete campaign', 'error');
      }
    } catch (error) {
      addToast('Error deleting campaign: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
      setDeleteModal({ isOpen: false, campaignId: null });
    }
  };

  const handleSend = async (campaignId) => {
    setIsLoading(true);
    try {
      const response = await campaignAPI.send(campaignId, localStorage.getItem('authToken'));
      if (response.success || response.sent) {
        addToast('Campaign sent successfully', 'success');
        fetchCampaigns();
      } else {
        addToast('Failed to send campaign', 'error');
      }
    } catch (error) {
      addToast('Error sending campaign: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async (campaignId) => {
    setIsLoading(true);
    try {
      const response = await campaignAPI.pause(campaignId, localStorage.getItem('authToken'));
      if (response.success) {
        addToast('Campaign paused', 'success');
        fetchCampaigns();
      } else {
        addToast('Failed to pause campaign', 'error');
      }
    } catch (error) {
      addToast('Error pausing campaign: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
    <div className="space-y-6 w-fit lg:w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between">
        <div>
          <h1 className="text-[20px] md:text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <span>All Newsletters</span>
          </h1>
          <p className="text-gray-600 mt-2">Manage and track all your newsletter campaigns</p>
        </div>
        <Link
          href="/dashboard/send-newsletter"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 mt-4 lg:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
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

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            defaultValue="recent"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="engagement">Highest Engagement</option>
          </select>
        </div>
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No campaigns found</p>
          <Link
            href="/dashboard/send-newsletter"
            className="mt-4 inline-block px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first campaign
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map(campaign => (
              <NewsletterCard
                key={campaign._id}
                campaign={campaign}
                onDelete={(id) => setDeleteModal({ isOpen: true, campaignId: id })}
                onEdit={(campaign) => setEditModal({ isOpen: true, campaign })}
                onSend={handleSend}
                onPause={handlePause}
              />
            ))}
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
        title="Delete Campaign"
        onClose={() => setDeleteModal({ isOpen: false, campaignId: null })}
        onConfirm={() => handleDelete(deleteModal.campaignId)}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        isLoading={isLoading}
      >
        <p className="text-gray-700">
          Are you sure you want to delete this campaign? This action cannot be undone.
        </p>
      </Modal>
    </div>
    </ProtectedRoute>
  );
}
