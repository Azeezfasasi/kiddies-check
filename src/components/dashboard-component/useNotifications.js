'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const useNotifications = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        setLoading(true);

        // Fetch pending quotes
        const quotesRes = await axios.get('/api/quote');
        const quotes = quotesRes.data.quotes || [];
        const pendingQuotes = quotes.filter(q => q.status?.toLowerCase() === 'pending');

        // Fetch contact form responses
        const contactsRes = await axios.get('/api/contact');
        const contacts = contactsRes.data.contacts || [];
        const pendingContacts = contacts.filter(
          c => c.status?.toLowerCase() === 'pending' || !c.status
        );

        // Combine notifications
        const combinedNotifications = [
          ...pendingQuotes.map(quote => ({
            id: `quote-${quote._id}`,
            type: 'quote',
            title: 'Pending Quote Request',
            message: `Quote request from ${quote.fullName || 'Unknown'}`,
            time: new Date(quote.createdAt).toLocaleDateString(),
            link: '/dashboard/quote-requests',
            icon: '📋',
          })),
          ...pendingContacts.map(contact => ({
            id: `contact-${contact._id}`,
            type: 'contact',
            title: 'Pending Contact Response',
            message: `Message from ${contact.fullName || contact.name || 'Unknown'}`,
            time: new Date(contact.createdAt).toLocaleDateString(),
            link: '/dashboard/contact-form-responses',
            icon: '💬',
          })),
        ];

        // Sort by most recent
        combinedNotifications.sort(
          (a, b) => new Date(b.time) - new Date(a.time)
        );

        setNotifications(combinedNotifications.slice(0, 10)); // Show last 10
        setUnreadCount(combinedNotifications.length);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
  };
};

export default useNotifications;
