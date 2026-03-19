
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const PAGE_SIZE = 10;

export default function AllUsersPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { token } = useAuth();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Modal states
  const [editModal, setEditModal] = useState({ open: false, user: null, loading: false });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null, loading: false });
  const [statusModal, setStatusModal] = useState({ open: false, user: null, loading: false });
  const [roleModal, setRoleModal] = useState({ open: false, user: null, loading: false, newRole: "" });
  const [message, setMessage] = useState(null);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    department: "",
    position: "",
  });

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: PAGE_SIZE,
      ...(search && { search }),
      ...(role && { role }),
      ...(status && { isActive: status }),
    });
    const res = await fetch(`/api/users?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, role, status, token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function handleEdit(user) {
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      company: user.company || "",
      department: user.department || "",
      position: user.position || "",
    });
    setEditModal({ open: true, user, loading: false });
  }

  function handleDelete(user) {
    setDeleteModal({ open: true, user, loading: false });
  }

  function handleChangeRole(user) {
    setRoleModal({ open: true, user, loading: false, newRole: user.role });
  }

  function handleChangeStatus(user) {
    setStatusModal({ open: true, user, loading: false });
  }

  async function submitEditUser() {
    if (!editForm.firstName || !editForm.lastName || !editForm.email) {
      setMessage({ type: "error", text: "First name, last name, and email are required" });
      return;
    }

    setEditModal(prev => ({ ...prev, loading: true }));
    try {
      const userId = editModal.user._id;
      console.log("Editing user:", userId);
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);

      if (res.ok) {
        setMessage({ type: "success", text: "User updated successfully" });
        setEditModal({ open: false, user: null, loading: false });
        setTimeout(() => setMessage(null), 3000);
        // Refresh users list
        await fetchUsers();
      } else {
        const errorMsg = data.message || `Failed to update user (${res.status})`;
        setMessage({ type: "error", text: errorMsg });
        console.error("API Error:", errorMsg);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setEditModal(prev => ({ ...prev, loading: false }));
    }
  }

  async function submitDeleteUser() {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const userId = deleteModal.user._id;
      console.log("Deleting user:", userId);
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setMessage({ type: "success", text: "User deleted successfully" });
        // Remove user from local state immediately
        setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
        // Update total count
        setTotal(prevTotal => Math.max(0, prevTotal - 1));
        setDeleteModal({ open: false, user: null, loading: false });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        const errorMsg = data.message || `Failed to delete user (${res.status})`;
        setMessage({ type: "error", text: errorMsg });
        console.error("API Error:", errorMsg);
        setDeleteModal(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage({ type: "error", text: `Error: ${err.message}` });
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  }

  async function submitChangeStatus() {
    setStatusModal(prev => ({ ...prev, loading: true }));
    try {
      const userId = statusModal.user._id;
      console.log("Changing status for user:", userId);
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setMessage({ type: "success", text: "User status updated successfully" });
        setStatusModal({ open: false, user: null, loading: false });
        setTimeout(() => setMessage(null), 3000);
        // Refresh users list
        await fetchUsers();
      } else {
        const data = await res.json();
        const errorMsg = data.message || `Failed to update status (${res.status})`;
        setMessage({ type: "error", text: errorMsg });
        console.error("API Error:", errorMsg);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setStatusModal(prev => ({ ...prev, loading: false }));
    }
  }

  async function submitChangeRole() {
    if (!roleModal.newRole) {
      setMessage({ type: "error", text: "Please select a role" });
      return;
    }

    setRoleModal(prev => ({ ...prev, loading: true }));
    try {
      const userId = roleModal.user._id;
      console.log("Changing role for user:", userId);
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: roleModal.newRole }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "User role updated successfully" });
        setRoleModal({ open: false, user: null, loading: false, newRole: "" });
        setTimeout(() => setMessage(null), 3000);
        // Refresh users list
        await fetchUsers();
      } else {
        const data = await res.json();
        const errorMsg = data.message || `Failed to update role (${res.status})`;
        setMessage({ type: "error", text: errorMsg });
        console.error("API Error:", errorMsg);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setRoleModal(prev => ({ ...prev, loading: false }));
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
    <div className="w-[360px] md:w-full md:max-w-7xl p-2 md:p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-[20px] md:text-2xl font-bold mb-4">All Users</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border px-3 py-2 rounded-lg w-64 outline-none border-gray-400 focus:ring-2 focus:ring-blue-500 text-[14px] md:text-base"
        />
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} className="border px-3 py-2 rounded-lg outline-none border-gray-400 focus:ring-2 focus:ring-blue-500 text-[14px] md:text-base">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="parent">Parent</option>
          <option value="learning-specialist">Learning Specialist</option>
          <option value="school-leader">School Leader</option>
          <option value="teacher">Teacher</option>
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border px-3 py-2 rounded-lg outline-none border-gray-400 focus:ring-2 focus:ring-blue-500 text-[14px] md:text-base">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse border-b">
                  <td className="px-4 py-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6">No users found.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user._id} className="border-b border-gray-300 hover:bg-gray-50">
                  <td className="px-4 py-2 text-[14px] md:text-base whitespace-nowrap">{user.firstName} {user.lastName}</td>
                  <td className="px-4 py-2 text-[14px] md:text-base">{user.email}</td>
                  <td className="px-4 py-2 capitalize text-[14px] md:text-base whitespace-nowrap">{user.role}</td>
                  <td className="px-4 py-2 text-[14px] md:text-base">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2 text-[14px] md:text-base">
                    <button onClick={() => handleEdit(user)} className="px-2 py-1 md:py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs text-nowrap cursor-pointer">Edit</button>
                    <button onClick={() => handleChangeRole(user)} className="px-2 py-1 md:py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs text-nowrap cursor-pointer">Change Role</button>
                    <button onClick={() => handleChangeStatus(user)} className="px-2 py-1 md:py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs text-nowrap cursor-pointer">Change Status</button>
                    <button onClick={() => handleDelete(user)} className="px-2 py-1 md:py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs text-nowrap cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center md:justify-end items-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
        >Prev</button>
        <span className="px-2">Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
        >Next</button>
      </div>

      {/* Global Message */}
      {message && (
        <div className={`mt-4 p-4 rounded ${message.type === "success" ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}>
          {message.text}
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position</label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={submitEditUser}
                disabled={editModal.loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editModal.loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditModal({ open: false, user: null, loading: false })}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete User</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{deleteModal.user.firstName} {deleteModal.user.lastName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={submitDeleteUser}
                disabled={deleteModal.loading}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteModal.loading ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteModal({ open: false, user: null, loading: false })}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModal.open && statusModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Change Status</h2>
            <p className="text-gray-700 mb-6">
              Current status: <strong className={statusModal.user.isActive ? "text-green-600" : "text-red-600"}>
                {statusModal.user.isActive ? "Active" : "Inactive"}
              </strong>
            </p>
            <p className="text-gray-700 mb-6">
              Change <strong>{statusModal.user.firstName} {statusModal.user.lastName}</strong> to <strong className={statusModal.user.isActive ? "text-red-600" : "text-green-600"}>
                {statusModal.user.isActive ? "Inactive" : "Active"}
              </strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={submitChangeStatus}
                disabled={statusModal.loading}
                className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                {statusModal.loading ? "Updating..." : "Confirm"}
              </button>
              <button
                onClick={() => setStatusModal({ open: false, user: null, loading: false })}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModal.open && roleModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Change Role</h2>
            <p className="text-gray-700 mb-4">
              Current role: <strong className="capitalize">{roleModal.user.role}</strong>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select New Role</label>
              <select
                value={roleModal.newRole}
                onChange={(e) => setRoleModal({ ...roleModal, newRole: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Role --</option>
                <option value="admin">Admin</option>
                <option value="parent">Parent</option>
                <option value="learning-specialist">Learning Specialist</option>
                <option value="school-leader">School Leader</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={submitChangeRole}
                disabled={roleModal.loading || !roleModal.newRole}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {roleModal.loading ? "Updating..." : "Update Role"}
              </button>
              <button
                onClick={() => setRoleModal({ open: false, user: null, loading: false, newRole: "" })}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
