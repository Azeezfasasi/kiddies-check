'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManageRegistration() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

      setStatusMessage({
        type: 'success',
        text: `✓ Approved: ${data.user.firstName} ${data.user.lastName}`,
      });

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

      setStatusMessage({
        type: 'success',
        text: `✓ Rejected: ${data.user.firstName} ${data.user.lastName}`,
      });

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

  // Filter registrations based on search term
  const filteredRegistrations = registrations.filter((reg) =>
    `${reg.firstName} ${reg.lastName} ${reg.school} ${reg.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Registration Approvals</h1>
              <p className="text-gray-600 mt-2">Manage and review pending school registrations</p>
            </div>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-200 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
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

        {/* Registrations Count Badge */}
        <div className="mb-6 inline-block">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg">
            {registrations.length} Pending Registration{registrations.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Main Content */}
        {registrations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Pending Registrations</h3>
            <p className="text-gray-600 mb-4">All registrations have been reviewed and processed.</p>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
            >
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registrations List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search by name, school, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                {/* List */}
                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredRegistrations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                  ) : (
                    filteredRegistrations.map((registration) => (
                      <button
                        key={registration._id}
                        onClick={() => setSelectedRegistration(registration)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition border-l-4 ${
                          selectedRegistration?._id === registration._id
                            ? 'bg-blue-50 border-blue-500'
                            : 'border-gray-200'
                        }`}
                      >
                        <p className="font-semibold text-gray-900 text-sm">
                          {registration.firstName} {registration.lastName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{registration.school}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{registration.email}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Registration Details */}
            {selectedRegistration ? (
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8 text-white">
                    <h2 className="text-2xl font-bold">
                      {selectedRegistration.firstName} {selectedRegistration.lastName}
                    </h2>
                    <p className="text-blue-100 mt-1">{selectedRegistration.school}</p>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                        📧 Contact Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Email</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.email}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Phone</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* School Information */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                        🏫 School Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">School Name</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.school}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Model</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.model}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Location</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.location}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Students</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.numberOfStudents}
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 font-medium">Teachers</p>
                          <p className="text-gray-900 font-semibold mt-1">
                            {selectedRegistration.numberOfTeachers}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* School Logo */}
                    {selectedRegistration.schoolLogo && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                          🎓 School Logo
                        </h3>
                        <img
                          src={selectedRegistration.schoolLogo}
                          alt="School Logo"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                      </div>
                    )}

                    {/* Rejection Reason Input */}
                    <div className="border-t pt-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        ⚠️ Rejection Reason (if rejecting)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why this registration is being rejected..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm resize-none"
                        rows="3"
                        disabled={processing}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This reason will be sent to the user via email.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="border-t pt-6 flex gap-3">
                      <button
                        onClick={() => handleApprove(selectedRegistration._id)}
                        disabled={processing}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          '✓ Approve Registration'
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(selectedRegistration._id)}
                        disabled={processing || !rejectionReason.trim()}
                        className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processing ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          '✕ Reject Registration'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-12 text-center text-gray-600">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-lg">Select a registration to view details and take action</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
