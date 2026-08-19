'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Users,
  MousePointerClick,
  MailWarning,
  ThumbsDown,
  UserMinus,
  Send,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { campaignAPI } from '@/utils/newsletter-api';
import { useToast } from '../../../components/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const STATUS_COLORS = {
  sent: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-red-100 text-red-800',
};

function StatTile({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
    </div>
  );
}

export default function CampaignAnalyticsPage() {
  const params = useParams();
  const { addToast } = useToast();
  const campaignId = params?.id;

  const [campaign, setCampaign] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchData = useCallback(async () => {
    if (!campaignId) return;
    setIsLoading(true);
    setNotFound(false);
    try {
      const token = localStorage.getItem('authToken');
      const [campaignRes, analyticsRes] = await Promise.all([
        campaignAPI.get(campaignId, token),
        campaignAPI.getAnalytics(campaignId, token),
      ]);

      if (campaignRes.success && campaignRes.campaign) {
        setCampaign(campaignRes.campaign);
      } else {
        setNotFound(true);
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.analytics);
        setActivityLogs(analyticsRes.activityLogs || []);
      }
    } catch (error) {
      addToast('Error loading campaign analytics: ' + error.message, 'error');
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
      <div className="space-y-6">
        <Link
          href="/dashboard/all-newsletters"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Newsletters
        </Link>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : notFound || !campaign ? (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Campaign not found</p>
            <p className="text-sm text-gray-500 mt-1">
              It may have been deleted, or the link is incorrect.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    {campaign.subject || campaign.title || 'Untitled Campaign'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-2 capitalize">
                    {campaign.campaignType || 'standard'} campaign
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    STATUS_COLORS[campaign.status] || 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {campaign.status || 'unknown'}
                </span>
              </div>

              <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                {campaign.sentAt ? (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-green-600" /> Sent {formatDate(campaign.sentAt)}
                  </span>
                ) : campaign.scheduledFor ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" /> Scheduled for{' '}
                    {formatDate(campaign.scheduledFor)}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Not sent yet
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile icon={Users} label="Recipients" value={analytics?.totalSent || 0} />
              <StatTile
                icon={BarChart3}
                label="Opens"
                value={analytics?.opens || 0}
                sublabel={`${analytics?.openRate || 0}% open rate`}
              />
              <StatTile
                icon={MousePointerClick}
                label="Clicks"
                value={analytics?.clicks || 0}
                sublabel={`${analytics?.clickRate || 0}% click rate`}
              />
              <StatTile
                icon={MailWarning}
                label="Bounces"
                value={analytics?.bounces || 0}
                sublabel={`${analytics?.bounceRate || 0}% bounce rate`}
              />
              <StatTile
                icon={ThumbsDown}
                label="Complaints"
                value={analytics?.complaints || 0}
                sublabel={`${analytics?.complaintRate || 0}% complaint rate`}
              />
              <StatTile
                icon={UserMinus}
                label="Unsubscribes"
                value={analytics?.unsubscribes || 0}
                sublabel={`${analytics?.unsubscribeRate || 0}% unsubscribe rate`}
              />
            </div>

            {/* Content preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Content</h2>
              <div
                className="text-sm text-gray-700 border border-gray-100 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: campaign.htmlContent || campaign.content || '<p>No content</p>' }}
              />
            </div>

            {/* Activity log */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Recipient Activity</h2>
              {activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  {campaign.status === 'sent'
                    ? 'No activity recorded yet.'
                    : 'Activity will appear here once this campaign is sent.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Subscriber</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Event</th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activityLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="px-4 py-2 text-gray-800">
                            {log.subscriberId?.email || 'Unknown'}
                          </td>
                          <td className="px-4 py-2 capitalize text-gray-700">{log.eventType}</td>
                          <td className="px-4 py-2 text-gray-500">{formatDate(log.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
