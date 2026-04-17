'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Eye, Edit2, Mail, Lock, Trash2, 
  ChevronDown, X, AlertTriangle, Loader
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ParentDetailsModal from '@/app/components/ParentDetailsModal';
import EditParentModal from '@/app/components/EditParentModal';
import ParentChildrenModal from '@/app/components/ParentChildrenModal';
import MessageParentModal from '@/app/components/MessageParentModal';
import ConfirmActionModal from '@/app/components/ConfirmActionModal';

export default function SchoolParentList() {
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolId, setSchoolId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'disable' or 'delete'
  const [selectedParent, setSelectedParent] = useState(null);

  // Pagination
  const [expandedRows, setExpandedRows] = useState({});
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'date'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'disabled'

  // Fetch parents data
  useEffect(() => {
    // Try multiple possible keys for school ID
    const storedSchoolId = localStorage.getItem('activeSchoolId') || localStorage.getItem('schoolId');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('userRole');

    if (!storedSchoolId || !storedUserId) {
      setLoading(false);
      return;
    }

    setSchoolId(storedSchoolId);
    setUserId(storedUserId);
    setUserRole(storedRole);

    fetchParents(storedSchoolId, storedUserId);
  }, []);

  const fetchParents = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/parents?schoolId=${schoolId}&search=`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch parents');
      }

      const data = await response.json();
      
      // Handle empty response
      if (!data.parents || data.parents.length === 0) {
        setParents([]);
        setFilteredParents([]);
        setLoading(false);
        return;
      }
      
      // Fetch additional data for each parent (children count, status, etc.)
      const enrichedParents = await Promise.all(
        data.parents.map(async (parent) => {
          try {
            const childRes = await fetch(
              `/api/teacher/students?schoolId=${schoolId}&parentId=${parent._id}`,
              {
                headers: { 'x-user-id': userId },
              }
            );
            const childData = await childRes.json();
            return {
              ...parent,
              childrenCount: childData.data?.length || 0,
            };
          } catch (err) {
            return { ...parent, childrenCount: 0 };
          }
        })
      );

      setParents(enrichedParents);
      filterAndSortParents(enrichedParents, searchQuery, filterStatus, sortBy);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast.error(error.message || 'Failed to load parents');
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort parents
  useEffect(() => {
    filterAndSortParents(parents, searchQuery, filterStatus, sortBy);
  }, [searchQuery, filterStatus, sortBy, parents]);

  const filterAndSortParents = (parentsData, query, status, sort) => {
    let filtered = parentsData;

    // Filter by status
    if (status === 'active') {
      filtered = filtered.filter((p) => p.isActive !== false);
    } else if (status === 'disabled') {
      filtered = filtered.filter((p) => p.isActive === false);
    }

    // Search filter
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(lowerQuery) ||
          p.lastName.toLowerCase().includes(lowerQuery) ||
          p.email.toLowerCase().includes(lowerQuery) ||
          (p.phone && p.phone.includes(query))
      );
    }

    // Sort
    if (sort === 'name') {
      filtered.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sort === 'date') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredParents(filtered);
  };

  const toggleExpandRow = (parentId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  // Modal actions
  const handleViewDetails = (parent) => {
    setSelectedParent(parent);
    setShowDetailsModal(true);
  };

  const handleEdit = (parent) => {
    setSelectedParent(parent);
    setShowEditModal(true);
  };

  const handleViewChildren = (parent) => {
    setSelectedParent(parent);
    setShowChildrenModal(true);
  };

  const handleMessage = (parent) => {
    setSelectedParent(parent);
    setShowMessageModal(true);
  };

  const handleDisable = (parent) => {
    setSelectedParent(parent);
    setConfirmAction('disable');
    setShowConfirmModal(true);
  };

  const handleDelete = (parent) => {
    setSelectedParent(parent);
    setConfirmAction('delete');
    setShowConfirmModal(true);
  };

  const confirmDisableParent = async () => {
    try {
      const response = await fetch(
        `/api/users/${selectedParent._id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify({ isActive: false }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disable parent');
      }

      // Update local state
      setParents((prev) =>
        prev.map((p) =>
          p._id === selectedParent._id ? { ...p, isActive: false } : p
        )
      );

      toast.success(`${selectedParent.firstName} ${selectedParent.lastName} has been disabled`);
      setShowConfirmModal(false);
      setSelectedParent(null);
    } catch (error) {
      console.error('Error disabling parent:', error);
      toast.error(error.message || 'Failed to disable parent');
    }
  };

  const confirmDeleteParent = async () => {
    try {
      const response = await fetch(
        `/api/users/${selectedParent._id}`,
        {
          method: 'DELETE',
          headers: {
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete parent');
      }

      // Update local state
      setParents((prev) => prev.filter((p) => p._id !== selectedParent._id));

      toast.success(`${selectedParent.firstName} ${selectedParent.lastName} has been deleted`);
      setShowConfirmModal(false);
      setSelectedParent(null);
    } catch (error) {
      console.error('Error deleting parent:', error);
      toast.error(error.message || 'Failed to delete parent');
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'disable') {
      confirmDisableParent();
    } else if (confirmAction === 'delete') {
      confirmDeleteParent();
    }
  };

  const handleEditSave = (updatedParent) => {
    setParents((prev) =>
      prev.map((p) => (p._id === updatedParent._id ? updatedParent : p))
    );
    setShowEditModal(false);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'school-leader', 'learning-specialist']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 md:p-8">
        <div className="w-full max-w-7xl mx-auto px-1 md:px-0">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-2 md:p-3 rounded-lg">
                    <Users className="text-white" size={26} />
                  </div>
                  School Parents
                </h1>
                <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">
                  Manage and track all parents in your school
                </p>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
                  />
                </div>
              </div>

              {/* Filter Status */}
              <div className="grid grid-cols-2 md:flex md:gap-2 gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs md:text-sm flex-1"
                >
                  <option value="all">All Parents</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-xs md:text-sm flex-1"
                >
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Date</option>
                </select>
              </div>
            </div>
          </div>

          {/* Parents List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16">
              <Loader className="text-blue-600 animate-spin mb-3 md:mb-4" size={44} />
              <p className="text-gray-600 text-sm md:text-base">Loading parents...</p>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
              <Users className="mx-auto text-gray-400 mb-3 md:mb-4" size={44} />
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Parents Found</h3>
              <p className="text-gray-600 text-sm md:text-base">
                {searchQuery ? 'Try adjusting your search criteria' : 'No parents have been registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredParents.map((parent) => (
                <div
                  key={parent._id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
                >
                  {/* Parent Row */}
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                      {/* Avatar & Basic Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base md:text-lg flex-shrink-0">
                          {parent.firstName.charAt(0)}
                          {parent.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-gray-900 truncate">
                            {parent.firstName} {parent.lastName}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-600 truncate">{parent.email}</p>
                          {parent.phone && (
                            <p className="text-xs md:text-sm text-gray-600 truncate">{parent.phone}</p>
                          )}
                        </div>
                      </div>

                      {/* Children Count */}
                      <div className="text-center md:text-center">
                        <p className="text-xs md:text-sm text-gray-600">Children</p>
                        <p className="text-xl md:text-2xl font-bold text-blue-600">
                          {parent.childrenCount || 0}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center justify-between md:justify-start gap-2">
                        <span
                          className={`px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium whitespace-nowrap ${
                            parent.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {parent.isActive !== false ? 'Active' : 'Disabled'}
                        </span>

                        {/* Actions Dropdown Toggle - Mobile Only */}
                        <button
                          onClick={() => toggleExpandRow(parent._id)}
                          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                          title="More options"
                        >
                          <ChevronDown
                            className={`text-gray-600 transition-transform ${
                              expandedRows[parent._id] ? 'rotate-180' : ''
                            }`}
                            size={24}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Actions for mobile (expanded) */}
                    {expandedRows[parent._id] && (
                      <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              handleViewDetails(parent);
                              toggleExpandRow(parent._id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-medium text-xs"
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            onClick={() => {
                              handleViewChildren(parent);
                              toggleExpandRow(parent._id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition font-medium text-xs"
                          >
                            <Users size={14} /> Children
                          </button>
                          <button
                            onClick={() => {
                              handleEdit(parent);
                              toggleExpandRow(parent._id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition font-medium text-xs"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              handleMessage(parent);
                              toggleExpandRow(parent._id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition font-medium text-xs"
                          >
                            <Mail size={14} /> Msg
                          </button>
                          <button
                            onClick={() => {
                              handleDisable(parent);
                              toggleExpandRow(parent._id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition font-medium text-xs"
                          >
                            <Lock size={14} /> {parent.isActive !== false ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => {
                              handleDelete(parent);
                              toggleExpandRow(parent._id);
                            }}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium text-xs"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for desktop (always visible) */}
                  <div className="hidden md:flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(parent)}
                      className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium text-sm"
                      title="View details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleViewChildren(parent)}
                      className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition font-medium text-sm"
                      title="View children"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(parent)}
                      className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition font-medium text-sm"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleMessage(parent)}
                      className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition font-medium text-sm"
                      title="Message"
                    >
                      <Mail size={18} />
                    </button>
                    <button
                      onClick={() => handleDisable(parent)}
                      className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition font-medium text-sm"
                      title={parent.isActive !== false ? 'Disable' : 'Enable'}
                    >
                      <Lock size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(parent)}
                      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium text-sm"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Summary */}
          {!loading && filteredParents.length > 0 && (
            <div className="mt-6 md:mt-8 text-center text-gray-600 text-sm md:text-base">
              <p>
                Showing <span className="font-bold text-gray-900">{filteredParents.length}</span> of{' '}
                <span className="font-bold text-gray-900">{parents.length}</span> parents
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        {showDetailsModal && selectedParent && (
          <ParentDetailsModal
            parent={selectedParent}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedParent(null);
            }}
          />
        )}

        {showEditModal && selectedParent && (
          <EditParentModal
            parent={selectedParent}
            userId={userId}
            onClose={() => {
              setShowEditModal(false);
              setSelectedParent(null);
            }}
            onSave={handleEditSave}
          />
        )}

        {showChildrenModal && selectedParent && (
          <ParentChildrenModal
            parent={selectedParent}
            schoolId={schoolId}
            userId={userId}
            onClose={() => {
              setShowChildrenModal(false);
              setSelectedParent(null);
            }}
          />
        )}

        {showMessageModal && selectedParent && (
          <MessageParentModal
            parent={selectedParent}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedParent(null);
            }}
          />
        )}

        {showConfirmModal && (
          <ConfirmActionModal
            title={confirmAction === 'disable' ? 'Disable Parent' : 'Delete Parent'}
            message={
              confirmAction === 'disable'
                ? `Are you sure you want to disable ${selectedParent?.firstName} ${selectedParent?.lastName}? They will no longer be able to access their account.`
                : `Are you sure you want to delete ${selectedParent?.firstName} ${selectedParent?.lastName}? This action cannot be undone.`
            }
            confirmText={confirmAction === 'disable' ? 'Disable' : 'Delete'}
            cancelText="Cancel"
            isDestructive={confirmAction === 'delete'}
            onConfirm={handleConfirmAction}
            onCancel={() => {
              setShowConfirmModal(false);
              setSelectedParent(null);
              setConfirmAction(null);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
