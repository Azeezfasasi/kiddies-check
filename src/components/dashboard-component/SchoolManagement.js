"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Separate memoized modal components to prevent recreation on parent render
const AddEditModal = React.memo(({
  isOpen,
  isEdit,
  onClose,
  onSubmit,
  formData,
  setFormData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? "Edit School" : "Add New School"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter school name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Model
              </label>
              <select value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select model</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="both">Both Primary and Secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Type
              </label>
              <select value={formData.schoolType} onChange={(e) => setFormData({ ...formData, schoolType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select type</option>
                <option value="my-childs-school">My Child's School</option>
                <option value="home-school">Home School</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website <span className="text-gray-600">(Optional)</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter website URL"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter school description"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {isEdit ? "Update School" : "Add School"}
          </button>
        </div>
      </div>
    </div>
  );
});

AddEditModal.displayName = "AddEditModal";

const DeleteConfirmModal = React.memo(({ isOpen, onClose, onConfirm, schoolName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-center text-gray-900">
            Delete School
          </h3>
          <p className="mt-2 text-sm text-center text-gray-500">
            Are you sure you want to delete "{schoolName}"? This action cannot
            be undone.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmModal.displayName = "DeleteConfirmModal";

export default function SchoolManagement() {
  const { user, token } = useAuth();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [schoolTypeFilter, setSchoolTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    model: "",
    website: "",
    description: "",
    schoolType: "",
  });

  // Fetch schools
  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page,
        pageSize,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { isActive: statusFilter }),
        ...(approvalFilter !== "all" && { approvalStatus: approvalFilter }),
        ...(schoolTypeFilter !== "all" && { schoolType: schoolTypeFilter }),
      });

      const response = await axios.get(`/api/schools?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSchools(response.data.schools);
        setTotalPages(response.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch schools:", err);
      setError("Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSchools();
    }
  }, [token, page, searchTerm, statusFilter, approvalFilter, schoolTypeFilter]);

  // Handle add school
  const handleAddSchool = async () => {
    try {
      const response = await axios.post("/api/schools", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          location: "",
          model: "",
          website: "",
          description: "",
          schoolType: "",
        });
        setPage(1);
        fetchSchools();
      }
    } catch (err) {
      console.error("Failed to add school:", err);
      setError(err.response?.data?.error || "Failed to add school");
    }
  };

  // Handle update school
  const handleUpdateSchool = async () => {
    try {
      const response = await axios.put(
        `/api/schools/${selectedSchool._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setShowEditModal(false);
        setSelectedSchool(null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          location: "",
          model: "",
          website: "",
          description: "",
          schoolType: "",
        });
        fetchSchools();
      }
    } catch (err) {
      console.error("Failed to update school:", err);
      setError(err.response?.data?.error || "Failed to update school");
    }
  };

  // Handle delete school
  const handleDeleteSchool = async () => {
    try {
      const response = await axios.delete(
        `/api/schools/${selectedSchool._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setShowDeleteModal(false);
        setSelectedSchool(null);
        if (schools.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchSchools();
        }
      }
    } catch (err) {
      console.error("Failed to delete school:", err);
      setError(err.response?.data?.error || "Failed to delete school");
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (schoolId, currentStatus) => {
    try {
      const response = await axios.patch(
        `/api/schools/${schoolId}/status`,
        { isActive: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        fetchSchools();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  // Handle approval status change
  const handleApprovalStatusChange = async (schoolId, newStatus) => {
    try {
      const response = await axios.patch(
        `/api/schools/${schoolId}/approval-status`,
        { approvalStatus: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        fetchSchools();
      }
    } catch (err) {
      console.error("Failed to update approval status:", err);
      setError(err.response?.data?.error || "Failed to update approval status");
    }
  };

  // Open edit modal
  const openEditModal = (school) => {
    setSelectedSchool(school);
    setFormData({
      name: school.name,
      email: school.email,
      phone: school.phone || "",
      location: school.location || "",
      model: school.model || "",
      website: school.website || "",
      description: school.description || "",
      schoolType: school.schoolType || "",
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Schools</h1>
            <p className="mt-1 text-gray-500">
              View, edit, add, and manage all schools
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Add School</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools..."
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            {/* Approval Filter */}
            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Approvals</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* School Type Filter */}
            <select
              value={schoolTypeFilter}
              onChange={(e) => {
                setSchoolTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All School Types</option>
              <option value="my-childs-school">My Child's School</option>
              <option value="home-school">Home School</option>
            </select>

            {/* Reset button */}
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setApprovalFilter("all");
                setSchoolTypeFilter("all");
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors col-span-1 sm:col-span-2 lg:col-span-1"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Schools Table/Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : schools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500 text-lg">No schools found</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      School Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      School Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Approval
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schools.map((school) => (
                    <tr key={school._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                            {school.logo || school.principal?.schoolLogo ? (
                              <Image
                                src={school.logo || school.principal?.schoolLogo}
                                alt={school.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                                unoptimized={false}
                              />
                            ) : (
                              <Image
                                src="/images/projectplaceholder.png"
                                alt={school.name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <p className="font-medium text-gray-900">{school.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {school.schoolType === "my-childs-school"
                          ? "My Child's School"
                          : school.schoolType === "home-school"
                          ? "Home School"
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {school.location || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">
                            <strong>{school.numberOfStudents || 0}</strong> Students
                          </span>
                          <span className="text-gray-600">
                            <strong>{school.numberOfTeachers || 0}</strong> Teachers
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleStatusToggle(school._id, school.isActive)
                          }
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            school.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {school.isActive ? (
                            <>
                              <Check className="w-4 h-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={school.approvalStatus || "pending"}
                          onChange={(e) =>
                            handleApprovalStatusChange(school._id, e.target.value)
                          }
                          className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer transition-colors ${
                            school.approvalStatus === "approved"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : school.approvalStatus === "rejected"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(school)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSchool(school);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {schools.map((school) => (
                <div
                  key={school._id}
                  className="bg-white rounded-lg shadow-sm p-4 border"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {school.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {school.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSchool(school);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-600">
                      <strong>Location:</strong> {school.location || "—"}
                    </p>
                    <p className="text-gray-600">
                      <strong>Students:</strong> {school.numberOfStudents || 0}
                    </p>
                    <p className="text-gray-600">
                      <strong>Teachers:</strong> {school.numberOfTeachers || 0}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <button
                      onClick={() =>
                        handleStatusToggle(school._id, school.isActive)
                      }
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        school.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {school.isActive ? "Active" : "Inactive"}
                    </button>
                    <select
                      value={school.approvalStatus || "pending"}
                      onChange={(e) =>
                        handleApprovalStatusChange(school._id, e.target.value)
                      }
                      className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${
                        school.approvalStatus === "approved"
                          ? "bg-green-100 text-green-800"
                          : school.approvalStatus === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <button
                    onClick={() => openEditModal(school)}
                    className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit School
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium">{page}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AddEditModal
        isOpen={showAddModal}
        isEdit={false}
        formData={formData}
        setFormData={setFormData}
        onClose={() => {
          setShowAddModal(false);
          setFormData({
            name: "",
            email: "",
            phone: "",
            location: "",
            model: "",
            website: "",
            description: "",
          });
        }}
        onSubmit={handleAddSchool}
      />

      <AddEditModal
        isOpen={showEditModal}
        isEdit={true}
        formData={formData}
        setFormData={setFormData}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSchool(null);
          setFormData({
            name: "",
            email: "",
            phone: "",
            location: "",
            model: "",
            website: "",
            description: "",
          });
        }}
        onSubmit={handleUpdateSchool}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSchool(null);
        }}
        onConfirm={handleDeleteSchool}
        schoolName={selectedSchool?.name}
      />
    </div>
  );
}
