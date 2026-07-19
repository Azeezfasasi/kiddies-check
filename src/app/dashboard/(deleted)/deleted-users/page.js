"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const PAGE_SIZE = 10;

export default function DeletedUsersPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { token } = useAuth();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Modal states
  const [reactivateModal, setReactivateModal] = useState({ open: false, user: null, loading: false });
  const [permanentDeleteModal, setPermanentDeleteModal] = useState({ open: false, user: null, loading: false });
  const [message, setMessage] = useState(null);

  // Bulk action states
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkReactivateModal, setBulkReactivateModal] = useState({ open: false, loading: false });
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ open: false, loading: false });

  // Set mounted flag
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchDeletedUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page,
      limit: PAGE_SIZE,
      ...(search && { search }),
      ...(role && { role }),
    });
    const res = await fetch(`/api/users/deleted?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, role, token]);

  useEffect(() => {
    fetchDeletedUsers();
  }, [fetchDeletedUsers]);

  function handleReactivate(user) {
    setReactivateModal({ open: true, user, loading: false });
  }

  function handlePermanentDelete(user) {
    setPermanentDeleteModal({ open: true, user, loading: false });
  }

  async function submitReactivate() {
    setReactivateModal(prev => ({ ...prev, loading: true }));
    try {
      const userId = reactivateModal.user._id;
      const res = await fetch(`/api/users/${userId}/reactivate`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setMessage({ type: "success", text: "User re-activated successfully" });
        setReactivateModal({ open: false, user: null, loading: false });
        setTimeout(() => setMessage(null), 3000);
        // Remove user from list
        setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
        setTotal(prevTotal => Math.max(0, prevTotal - 1));
      } else {
        const data = await res.json();
        const errorMsg = data.message || `Failed to re-activate user (${res.status})`;
        setMessage({ type: "error", text: errorMsg });
      }
    } catch (err) {
      setMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setReactivateModal(prev => ({ ...prev, loading: false }));
    }
  }

  async function submitPermanentDelete() {
    setPermanentDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const userId = permanentDeleteModal.user._id;
      const res = await fetch(`/api/users/${userId}/permanent`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setMessage({ type: "success", text: "User permanently deleted from database" });
        setPermanentDeleteModal({ open: false, user: null, loading: false });
        setTimeout(() => setMessage(null), 3000);
        // Remove user from list
        setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
        setTotal(prevTotal => Math.max(0, prevTotal - 1));
      } else {
        const data = await res.json();
        const errorMsg = data.message || `Failed to permanently delete user (${res.status})`;
        setMessage({ type: "error", text: errorMsg });
      }
    } catch (err) {
      setMessage({ type: "error", text: `Error: ${err.message}` });
    } finally {
      setPermanentDeleteModal(prev => ({ ...prev, loading: false }));
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Toggle individual user selection
  function toggleSelectUser(userId) {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }

  // Toggle select all users on current page
  function toggleSelectAll() {
    if (selectedUsers.size === users.length && users.length > 0) {
      setSelectedUsers(new Set());
    } else {
      const allUserIds = new Set(users.map(u => u._id));
      setSelectedUsers(allUserIds);
    }
  }

  // Bulk reactivate handler
  function handleBulkReactivate() {
    setBulkReactivateModal({ open: true, loading: false });
  }

  // Bulk permanent delete handler
  function handleBulkPermanentDelete() {
    setBulkDeleteModal({ open: true, loading: false });
  }

  // Submit bulk reactivate
  async function submitBulkReactivate() {
    setBulkReactivateModal(prev => ({ ...prev, loading: true }));
    try {
      const userIds = Array.from(selectedUsers);
      const results = await Promise.all(
        userIds.map(userId =>
          fetch(`/api/users/${userId}/reactivate`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      const allSuccess = results.every(r => r.ok);
      if (allSuccess) {
        setMessage({ type: 'success', text: `${selectedUsers.size} user(s) re-activated successfully` });
        setBulkReactivateModal({ open: false, loading: false });
        setSelectedUsers(new Set());
        setTimeout(() => setMessage(null), 3000);
        // Refresh the list
        fetchDeletedUsers();
      } else {
        setMessage({ type: 'error', text: 'Some users could not be re-activated' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setBulkReactivateModal(prev => ({ ...prev, loading: false }));
    }
  }

  // Submit bulk permanent delete
  async function submitBulkPermanentDelete() {
    setBulkDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const userIds = Array.from(selectedUsers);
      const results = await Promise.all(
        userIds.map(userId =>
          fetch(`/api/users/${userId}/permanent`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      const allSuccess = results.every(r => r.ok);
      if (allSuccess) {
        setMessage({ type: 'success', text: `${selectedUsers.size} user(s) permanently deleted` });
        setBulkDeleteModal({ open: false, loading: false });
        setSelectedUsers(new Set());
        setTimeout(() => setMessage(null), 3000);
        // Refresh the list
        fetchDeletedUsers();
      } else {
        setMessage({ type: 'error', text: 'Some users could not be permanently deleted' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setBulkDeleteModal(prev => ({ ...prev, loading: false }));
    }
  }

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
        <h1 className="text-[20px] md:text-2xl font-bold mb-4">Deleted Users</h1>

        {/* Total deleted users count */}
        <div className="mb-4 font-bold text-blue-600">
          Total Deleted Users: <span className="font-semibold text-gray-700">{total}</span>
        </div>

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
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg flex flex-wrap items-center justify-between gap-4">
            <span className="text-blue-700 font-semibold">{selectedUsers.size} user(s) selected</span>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleBulkReactivate}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Reactivate
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Permanent Delete
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Deleted At</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse border-b">
                    <td className="px-4 py-2">
                      <div className="h-4 bg-gray-200 rounded w-6"></div>
                    </td>
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
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6">No deleted users found.</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} className="border-b border-gray-300 hover:bg-gray-50">
                    <td className="px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user._id)}
                        onChange={() => toggleSelectUser(user._id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-2 text-[14px] md:text-base whitespace-nowrap">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-2 text-[14px] md:text-base">{user.email}</td>
                    <td className="px-4 py-2 capitalize text-[14px] md:text-base whitespace-nowrap">{user.role}</td>
                    <td className="px-4 py-2 text-[14px] md:text-base whitespace-nowrap">
                      {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2 flex gap-2 text-[14px] md:text-base">
                      <button onClick={() => handleReactivate(user)} className="px-2 py-1 md:py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs text-nowrap cursor-pointer">Reactivate</button>
                      <button onClick={() => handlePermanentDelete(user)} className="px-2 py-1 md:py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs text-nowrap cursor-pointer">Permanent Delete</button>
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

        {/* Reactivate Modal */}
        {reactivateModal.open && reactivateModal.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Re-activate User</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to re-activate <strong>{reactivateModal.user.firstName} {reactivateModal.user.lastName}</strong>? They will regain access to their account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={submitReactivate}
                  disabled={reactivateModal.loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {reactivateModal.loading ? "Re-activating..." : "Re-activate"}
                </button>
                <button
                  onClick={() => setReactivateModal({ open: false, user: null, loading: false })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Permanent Delete Modal */}
        {permanentDeleteModal.open && permanentDeleteModal.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Permanently Delete User</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to permanently delete <strong>{permanentDeleteModal.user.firstName} {permanentDeleteModal.user.lastName}</strong>? This action <strong>cannot be undone</strong> - the user will be removed from the database completely.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={submitPermanentDelete}
                  disabled={permanentDeleteModal.loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {permanentDeleteModal.loading ? "Deleting..." : "Permanently Delete"}
                </button>
                <button
                  onClick={() => setPermanentDeleteModal({ open: false, user: null, loading: false })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Reactivate Modal */}
        {bulkReactivateModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Reactivate {selectedUsers.size} User(s)</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to re-activate {selectedUsers.size} user(s)? They will regain access to their accounts.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={submitBulkReactivate}
                  disabled={bulkReactivateModal.loading}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {bulkReactivateModal.loading ? "Re-activating..." : "Re-activate"}
                </button>
                <button
                  onClick={() => setBulkReactivateModal({ open: false, loading: false })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Permanent Delete Modal */}
        {bulkDeleteModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Permanently Delete {selectedUsers.size} User(s)</h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to permanently delete {selectedUsers.size} user(s)? This action <strong>cannot be undone</strong> - all selected users will be removed from the database completely.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={submitBulkPermanentDelete}
                  disabled={bulkDeleteModal.loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkDeleteModal.loading ? "Deleting..." : "Permanently Delete"}
                </button>
                <button
                  onClick={() => setBulkDeleteModal({ open: false, loading: false })}
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
