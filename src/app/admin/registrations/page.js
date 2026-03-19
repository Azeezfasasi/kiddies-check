'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RegistrationApprovalsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Fetch pending registrations
  useEffect(() => {
    if (!token) return;

    const fetchRegistrations = async () => {
      try {
        const response = await fetch('/api/admin/registrations', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Failed to fetch registrations');
          return;
        }

        setRegistrations(data.registrations || []);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('An error occurred while fetching registrations');
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, [token]);

  const handleApprove = async (registrationId) => {
    if (processing) return;

    setProcessing(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: registrationId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message });
        return;
      }

      setStatusMessage({ type: 'success', text: `Approved: ${data.user.firstName} ${data.user.lastName}` });

      // Remove from list
      setRegistrations(registrations.filter((reg) => reg._id !== registrationId));
      setSelectedRegistration(null);
    } catch (err) {
      console.error('Error approving registration:', err);
      setStatusMessage({ type: 'error', text: 'Failed to approve registration' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (registrationId) => {
    if (!rejectionReason.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    if (processing) return;

    setProcessing(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: registrationId,
          action: 'reject',
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusMessage({ type: 'error', text: data.message });
        return;
      }

      setStatusMessage({ type: 'success', text: `Rejected: ${data.user.firstName} ${data.user.lastName}` });

      // Remove from list
      setRegistrations(registrations.filter((reg) => reg._id !== registrationId));
      setSelectedRegistration(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting registration:', err);
      setStatusMessage({ type: 'error', text: 'Failed to reject registration' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Registration Approvals</h1>
          <p className="text-gray-600 mt-2">Manage pending school registrations</p>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              statusMessage.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-900'
                : 'bg-red-50 border-red-500 text-red-900'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border-l-4 border-red-500 text-red-900">
            {error}
          </div>
        )}

        {/* Registrations Count */}
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-blue-900 font-medium">
            {registrations.length} pending registration{registrations.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>

        {/* Main Content */}
        {registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Pending Registrations</h3>
            <p className="text-gray-600">All registrations have been reviewed and processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registrations List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="font-semibold text-gray-900">Pending Registrations</h2>
                </div>
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {registrations.map((registration) => (
                    <button
                      key={registration._id}
                      onClick={() => setSelectedRegistration(registration)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                        selectedRegistration?._id === registration._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        {registration.firstName} {registration.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{registration.school}</p>
                      <p className="text-xs text-gray-500 mt-1">{registration.email}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Registration Details */}
            {selectedRegistration ? (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedRegistration.firstName} {selectedRegistration.lastName}
                    </h2>
                    <p className="text-gray-600">{selectedRegistration.school}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Contact Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Email</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Phone</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* School Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">School Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">School Name</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.school}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Model</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.model}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Location</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.location}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Students</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.numberOfStudents}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Teachers</p>
                          <p className="text-gray-900 font-medium">{selectedRegistration.numberOfTeachers}</p>
                        </div>
                      </div>
                    </div>

                    {/* School Logo */}
                    {selectedRegistration.schoolLogo && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">School Logo</h3>
                        <img
                          src={selectedRegistration.schoolLogo}
                          alt="School Logo"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    {/* Approval Actions */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Actions</h3>

                      {/* Rejection Reason Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason (if rejecting)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                          disabled={processing}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(selectedRegistration._id)}
                          disabled={processing}
                          className="flex-1 bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(selectedRegistration._id)}
                          disabled={processing || !rejectionReason.trim()}
                          className="flex-1 bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processing ? 'Processing...' : '✕ Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-8 text-center text-gray-600">
                Select a registration to view details and take action
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
