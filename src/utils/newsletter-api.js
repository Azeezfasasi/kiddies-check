/**
 * Newsletter API Utilities
 * Frontend helper functions for newsletter management
 */

const API_BASE = '/api/newsletter';

// ============================================
// SUBSCRIBER MANAGEMENT
// ============================================

export const subscriberAPI = {
  /**
   * Subscribe to newsletter
   */
  subscribe: async (email, firstName, lastName, tags = []) => {
    try {
      const response = await fetch(`${API_BASE}?action=subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          tags,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  },

  /**
   * Unsubscribe from newsletter
   */
  unsubscribe: async (email) => {
    try {
      const response = await fetch(`${API_BASE}?action=unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error('Unsubscribe error:', error);
      throw error;
    }
  },

  /**
   * Get all subscribers (Admin only)
   */
  getAllSubscribers: async (
    page = 1,
    limit = 20,
    status = 'active',
    search = '',
    tags = [],
    token = ''
  ) => {
    try {
      const params = new URLSearchParams({
        action: 'subscribers',
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search }),
      });

      tags.forEach(tag => params.append('tags', tag));

      const response = await fetch(`${API_BASE}?${params}`, {
        headers: {
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get subscribers error:', error);
      throw error;
    }
  },

  /**
   * Get single subscriber details
   */
  getSubscriber: async (email) => {
    try {
      const response = await fetch(
        `${API_BASE}?action=subscriber&email=${encodeURIComponent(email)}`
      );
      return await response.json();
    } catch (error) {
      console.error('Get subscriber error:', error);
      throw error;
    }
  },

  /**
   * Update subscriber (Admin only)
   */
  updateSubscriber: async (email, updateData, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=update-subscriber`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          email,
          updateData,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Update subscriber error:', error);
      throw error;
    }
  },

  /**
   * Delete subscriber (Admin only)
   */
  deleteSubscriber: async (email, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=delete-subscriber`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error) {
      console.error('Delete subscriber error:', error);
      throw error;
    }
  },

  /**
   * Bulk import subscribers (Admin only)
   */
  bulkImport: async (subscribers, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ subscribers }),
      });
      return await response.json();
    } catch (error) {
      console.error('Bulk import error:', error);
      throw error;
    }
  },

  /**
   * Bulk update subscribers (Admin only)
   */
  bulkUpdate: async (subscriberIds, updateData, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=bulk-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          subscriberIds,
          updateData,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Bulk update error:', error);
      throw error;
    }
  },

  /**
   * Bulk delete subscribers (Admin only)
   */
  bulkDelete: async (subscriberIds, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ subscriberIds }),
      });
      return await response.json();
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  },
};

// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

export const campaignAPI = {
  /**
   * Create new campaign (Admin only)
   */
  create: async (campaignData, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=create-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(campaignData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create campaign error:', error);
      throw error;
    }
  },

  /**
   * Send campaign immediately (Admin only)
   */
  send: async (campaignId, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=send-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ campaignId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send campaign error:', error);
      throw error;
    }
  },

  /**
   * Schedule campaign for later (Admin only)
   */
  schedule: async (campaignId, scheduledFor, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=schedule-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          campaignId,
          scheduledFor,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Schedule campaign error:', error);
      throw error;
    }
  },

  /**
   * Edit campaign (Admin only)
   */
  edit: async (campaignId, updateData, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=edit-campaign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          campaignId,
          updateData,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Edit campaign error:', error);
      throw error;
    }
  },

  /**
   * Get campaign details (Admin only)
   */
  get: async (campaignId, token = '') => {
    try {
      const response = await fetch(
        `${API_BASE}/${campaignId}?type=campaign`,
        {
          headers: {
            'x-user-role': 'admin',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Get campaign error:', error);
      throw error;
    }
  },

  /**
   * Get all campaigns (Admin only)
   */
  getAll: async (
    status = '',
    page = 1,
    limit = 20,
    search = '',
    token = ''
  ) => {
    try {
      const params = new URLSearchParams({
        action: 'campaigns',
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(search && { search }),
      });

      const response = await fetch(`${API_BASE}?${params}`, {
        headers: {
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get campaigns error:', error);
      throw error;
    }
  },

  /**
   * Get campaign analytics (Admin only)
   */
  getAnalytics: async (campaignId, token = '') => {
    try {
      const response = await fetch(
        `${API_BASE}/${campaignId}?type=campaign&action=analytics`,
        {
          headers: {
            'x-user-role': 'admin',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Get analytics error:', error);
      throw error;
    }
  },

  /**
   * Pause campaign (Admin only)
   */
  pause: async (campaignId, token = '') => {
    try {
      const response = await fetch(
        `${API_BASE}/${campaignId}?type=campaign&action=pause`,
        {
          method: 'PUT',
          headers: {
            'x-user-role': 'admin',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        }
      );
      return await response.json();
    } catch (error) {
      console.error('Pause campaign error:', error);
      throw error;
    }
  },

  /**
   * Delete campaign (Admin only)
   */
  delete: async (campaignId, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=delete-campaign`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ campaignId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Delete campaign error:', error);
      throw error;
    }
  },
};

// ============================================
// TEMPLATE MANAGEMENT
// ============================================

export const templateAPI = {
  /**
   * Create template (Admin only)
   */
  create: async (templateData, token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=create-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(templateData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create template error:', error);
      throw error;
    }
  },

  /**
   * Get all templates (Admin only)
   */
  getAll: async (category = '', page = 1, limit = 20, token = '') => {
    try {
      const params = new URLSearchParams({
        action: 'templates',
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
      });

      const response = await fetch(`${API_BASE}?${params}`, {
        headers: {
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get templates error:', error);
      throw error;
    }
  },
};

// ============================================
// STATISTICS
// ============================================

export const statisticsAPI = {
  /**
   * Get newsletter statistics (Admin only)
   */
  getAll: async (token = '') => {
    try {
      const response = await fetch(`${API_BASE}?action=statistics`, {
        headers: {
          'x-user-role': 'admin',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get statistics error:', error);
      throw error;
    }
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const newsletterHelpers = {
  /**
   * Format email statistics for display
   */
  formatStatistics: (stats) => {
    return {
      ...stats,
      openRate: `${stats.openRate}%`,
      clickRate: `${stats.clickRate}%`,
      bounceRate: `${stats.bounceRate}%`,
      complaintRate: `${stats.complaintRate}%`,
      unsubscribeRate: `${stats.unsubscribeRate}%`,
    };
  },

  /**
   * Validate email format
   */
  validateEmail: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  /**
   * Format date for display
   */
  formatDate: (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  /**
   * Generate CSV from subscribers
   */
  generateSubscriberCSV: (subscribers) => {
    const headers = ['Email', 'First Name', 'Last Name', 'Status', 'Subscribed Date'];
    const rows = subscribers.map(s => [
      s.email,
      s.firstName || '',
      s.lastName || '',
      s.subscriptionStatus,
      new Date(s.subscribedAt).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  },

  /**
   * Download CSV file
   */
  downloadCSV: (filename, csvContent) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  },
};

// Named exports for all modules
const newsletterAPIExports = {
  subscriberAPI,
  campaignAPI,
  templateAPI,
  statisticsAPI,
  newsletterHelpers,
};

export default newsletterAPIExports;
