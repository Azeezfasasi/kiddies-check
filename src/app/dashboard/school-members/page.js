'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, UserCheck, Clock, AlertCircle, Download } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function SchoolMembersPage() {
  const [schoolId, setSchoolId] = useState('');
  const [stats, setStats] = useState({
    activeMembers: 0,
    invitedMembers: 0,
    totalMembers: 0,
  });
  const [membersByRole, setMembersByRole] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSchoolId = async () => {
      try {
        // First check localStorage for stored schoolId
        const storedSchoolId = localStorage.getItem('schoolId');
        if (storedSchoolId) {
          setSchoolId(storedSchoolId);
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
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    getSchoolId();
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    fetchStatistics();
  }, [schoolId]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/school/invite-member?schoolId=${schoolId}&status=active&limit=1000`);
      if (response.ok) {
        const { data } = await response.json();
        const roleGroups = {};
        
        data.members.forEach((member) => {
          const role = member.role;
          if (!roleGroups[role]) {
            roleGroups[role] = [];
          }
          roleGroups[role].push(member);
        });

        setMembersByRole(roleGroups);
        
        setStats({
          totalMembers: data.members.length,
          activeMembers: data.members.filter((m) => m.status === 'active').length,
          invitedMembers: data.members.filter((m) => m.status === 'invited').length,
        });
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportMembers = () => {
    const data = [];
    Object.entries(membersByRole).forEach(([role, members]) => {
      members.forEach((member) => {
        // Skip members without user references
        if (!member.user) return;
        data.push({
          Name: `${member.user.firstName} ${member.user.lastName}`,
          Email: member.user.email,
          Role: role,
          Status: member.status,
          'Joined Date': new Date(member.createdAt).toLocaleDateString(),
        });
      });
    });

    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map((row) => Object.values(row).map((v) => `"${v}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const ROLE_LABELS = {
    'school-leader': 'School Leaders',
    teacher: 'Teachers',
    parent: 'Parents',
    staff: 'Staff',
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'school-leader']}>
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                  School Members
                </h1>
              </div>
              <button
                onClick={exportMembers}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              View and manage all members of your school
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Members</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
                    {stats.totalMembers}
                  </p>
                </div>
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 opacity-20 hidden sm:block" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Members</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                    {stats.activeMembers}
                  </p>
                </div>
                <UserCheck className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 opacity-20 hidden sm:block" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 col-span-2 sm:col-span-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Pending Invitations</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">
                    {stats.invitedMembers}
                  </p>
                </div>
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 opacity-20 hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Members by Role */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(membersByRole).length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-600">
                    No members yet. Go to{' '}
                    <a href="/dashboard/invite-member" className="text-blue-600 hover:underline">
                      Invite Member
                    </a>{' '}
                    to add members.
                  </p>
                </div>
              ) : (
                Object.entries(membersByRole).map(([role, members]) => (
                  <div key={role} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Role Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        {ROLE_LABELS[role] || role} ({members.length})
                      </h2>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                              Name
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                              Email
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                              Status
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                              Joined
                            </th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                              Last Active
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {members.map((member) => {
                            if (!member.user) return null;
                            return (
                            <tr key={member._id} className="hover:bg-gray-50">
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs sm:text-sm font-semibold text-blue-600">
                                      {member.user.firstName.charAt(0)}
                                      {member.user.lastName.charAt(0)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-xs sm:text-sm text-gray-900">
                                      {member.user.firstName} {member.user.lastName}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 break-all">
                                {member.user.email}
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span
                                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap ${
                                    member.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : member.status === 'invited'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : member.status === 'inactive'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {member.status.charAt(0).toUpperCase() +
                                    member.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                                {new Date(member.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                                {member.lastAccessAt
                                  ? new Date(member.lastAccessAt).toLocaleDateString()
                                  : 'Never'}
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-200">
                      {members.map((member) => {
                        if (!member.user) return null;
                        return (
                        <div key={member._id} className="p-4 sm:p-6 space-y-3 hover:bg-gray-50">
                          {/* Name and Avatar */}
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-600">
                                {member.user.firstName.charAt(0)}
                                {member.user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm sm:text-base">
                                {member.user.firstName} {member.user.lastName}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 break-all">
                                {member.user.email}
                              </p>
                            </div>
                          </div>

                          {/* Status and Dates */}
                          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                            <div>
                              <p className="text-gray-500 font-medium mb-1">Status</p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                                  member.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : member.status === 'invited'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : member.status === 'inactive'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {member.status.charAt(0).toUpperCase() +
                                  member.status.slice(1)}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium mb-1">Joined</p>
                              <p className="text-gray-700">
                                {new Date(member.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Last Active */}
                          <div>
                            <p className="text-gray-500 font-medium mb-1 text-xs sm:text-sm">Last Active</p>
                            <p className="text-gray-700 text-xs sm:text-sm">
                              {member.lastAccessAt
                                ? new Date(member.lastAccessAt).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
