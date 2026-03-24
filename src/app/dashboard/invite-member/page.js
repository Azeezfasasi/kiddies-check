'use client';

import { useState, useEffect } from 'react';
import { Loader, Mail, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const MEMBER_ROLES = [
  { value: 'school-leader', label: 'School Leader', color: 'bg-purple-100 text-purple-800' },
  { value: 'teacher', label: 'Teacher', color: 'bg-blue-100 text-blue-800' },
  { value: 'parent', label: 'Parent', color: 'bg-green-100 text-green-800' },
  // { value: 'staff', label: 'Staff', color: 'bg-gray-100 text-gray-800' },
];

export default function InviteMemberPage() {
  const [schoolId, setSchoolId] = useState('');
  const [userSchoolName, setUserSchoolName] = useState('');
  const [schools, setSchools] = useState([]);
  const [showSchoolSelector, setShowSchoolSelector] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'teacher',
    permissions: [],
  });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');

  // Get school ID from user context or session
  useEffect(() => {
    const getSchoolId = async () => {
      try {
        setLoadingSchools(true);
        
        // First check localStorage for stored schoolId
        const storedSchoolId = localStorage.getItem('schoolId');
        if (storedSchoolId) {
          setSchoolId(storedSchoolId);
          setLoadingSchools(false);
          return;
        }

        // Get auth token from localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        
        // Try /api/auth/me with token if available
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data?.schoolId) {
              setSchoolId(data.data.schoolId);
              localStorage.setItem('schoolId', data.data.schoolId);
              setLoadingSchools(false);
              return;
            } else if (data.data?.school?.name) {
              // User has school name but not schoolId
              setUserSchoolName(data.data.school.name);
              setShowSchoolSelector(true);
              setLoadingSchools(false);
              return;
            }
          }
        }

        // If we get here, school not found
        setError('School not found. Please contact your administrator.');
        setLoadingSchools(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Unable to load school information.');
        setLoadingSchools(false);
      }
    };
    getSchoolId();
  }, []);

  // Fetch members
  useEffect(() => {
    if (!schoolId) return;
    setShowSchoolSelector(false);
    fetchMembers();
  }, [schoolId, filterStatus]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(
        `/api/school/invite-member?schoolId=${schoolId}&status=${filterStatus}`
      );
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data.members || []);
      } else {
        toast.error('Failed to fetch members');
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Failed to fetch members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectSchool = (selectedSchoolId) => {
    setSchoolId(selectedSchoolId);
    localStorage.setItem('schoolId', selectedSchoolId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolId) {
      setError('School ID not found. Please refresh the page.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/school/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('userId') || '',
        },
        body: JSON.stringify({
          schoolId,
          email: formData.email.toLowerCase(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          role: formData.role,
          permissions: formData.permissions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Member invited successfully');
        setFormData({ email: '', firstName: '', lastName: '', role: 'teacher', permissions: [] });
        toast.success('Invitation sent!');
        fetchMembers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to invite member');
        toast.error(data.error || 'Failed to invite member');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      toast.error('Failed to invite member');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/school/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Member removed');
        fetchMembers();
      } else {
        toast.error('Failed to remove member');
      }
    } catch (err) {
      toast.error('Failed to remove member');
      console.error('Error:', err);
    }
  };

  const handleUpdateMember = async (memberId, updates) => {
    try {
      const response = await fetch(`/api/school/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        toast.success('Member updated');
        setEditingId(null);
        fetchMembers();
      } else {
        toast.error('Failed to update member');
      }
    } catch (err) {
      toast.error('Failed to update member');
      console.error('Error:', err);
    }
  };

  const getRoleBadgeColor = (role) => {
    const roleObj = MEMBER_ROLES.find((r) => r.value === role);
    return roleObj?.color || 'bg-gray-100 text-gray-800';
  };

  // Show school selector if no schoolId but user has school name
  if (showSchoolSelector && userSchoolName) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'school-leader', 'learning-specialist']}>
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto px-3 sm:px-4">
            <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Setup School Access
              </h1>
              <p className="text-gray-600 mb-6">
                Your account shows school: <strong>{userSchoolName}</strong>
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  Your user record needs to be linked to a school. Please contact your administrator to complete the setup.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => window.location.href = '/contact'}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'school-leader']}>
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Manage School Members
            </h1>
            <p className="text-gray-600">
              Invite teachers, parents, and staff to access your school's data
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invite Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Invite Member
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {success}
                  </div>
                )}

                {loadingSchools && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading school information...
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="teacher@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !schoolId}
                    />
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !schoolId}
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-gray-500 text-xs">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !schoolId}
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading || !schoolId}
                    >
                      {MEMBER_ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || loadingSchools || !formData.email.trim() || !schoolId}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Invitation</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>💡 Tip:</strong> New members will receive an invitation email with a link to create their account. Existing members will be added immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-0 md:gap-4 px-2 md:px-6 py-4">
                    {['active', 'invited', 'inactive'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 font-medium text-sm transition ${
                          filterStatus === status
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)} Members
                      </button>
                    ))}
                  </div>
                </div>

                {/* Members Table */}
                <div className="overflow-x-auto">
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No members found</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Member
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {members.map((member) => {
                          // Skip members without user references
                          if (!member.user) {
                            return null;
                          }
                          return (
                          <tr
                            key={member._id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {member.user.firstName} {member.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {member.user.email}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {editingId === member._id ? (
                                <select
                                  value={member.role}
                                  onChange={(e) =>
                                    handleUpdateMember(member._id, {
                                      role: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                                >
                                  {MEMBER_ROLES.map((role) => (
                                    <option key={role.value} value={role.value}>
                                      {role.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                                    member.role
                                  )}`}
                                >
                                  {MEMBER_ROLES.find((r) => r.value === member.role)
                                    ?.label || member.role}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  member.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : member.status === 'invited'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {member.status.charAt(0).toUpperCase() +
                                  member.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                {editingId === member._id ? (
                                  <>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                                      title="Save"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingId(member._id)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                      title="Edit Role"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleRemoveMember(member._id)
                                      }
                                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                                      title="Remove"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
