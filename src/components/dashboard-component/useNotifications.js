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

        // Fetch pending registrations
        const registrationsRes = await axios.get('/api/admin/registrations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const registrations = registrationsRes.data.registrations || [];
        const pendingRegistrations = registrations.filter(
          r => r.approvalStatus?.toLowerCase() === 'pending'
        );

        // Fetch contact form responses
        const contactsRes = await axios.get('/api/contact');
        const contacts = contactsRes.data.contacts || [];
        const pendingContacts = contacts.filter(
          c => c.status?.toLowerCase() === 'pending' || !c.status
        );

        // Combine notifications
        const combinedNotifications = [
          ...pendingRegistrations.map(registration => ({
            id: `registration-${registration._id}`,
            type: 'registration',
            title: 'Pending Registration',
            message: `${registration.firstName} ${registration.lastName} (${registration.school || 'Unknown School'})`,
            time: new Date(registration.createdAt).toLocaleDateString(),
            link: '/dashboard/manage-registration',
            icon: '👤',
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
