"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function generateClientPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export default function ChangeUserPassword() {
  const [isMounted, setIsMounted] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { success, message, temporaryPassword, emailSent }
  const [error, setError] = useState("");

  const searchTimeout = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isMounted, isAuthenticated, router]);

  const runSearch = useCallback(
    async (term) => {
      if (!term || term.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const params = new URLSearchParams({ search: term, limit: 8, page: 1 });
        const res = await fetch(`/api/users?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    },
    [token]
  );

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setResult(null);
    setError("");
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => runSearch(value), 350);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchTerm("");
    setNewPassword("");
    setResult(null);
    setError("");
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setNewPassword("");
    setResult(null);
    setError("");
  };

  const handleGeneratePassword = () => {
    setNewPassword(generateClientPassword());
    setShowPassword(true);
  };

  const copyPassword = (value) => {
    navigator.clipboard.writeText(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword && newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/users/${selectedUser._id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to change password");
      }
      setResult(data);
      setNewPassword(data.temporaryPassword || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isMounted || !isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="w-[360px] md:w-full md:max-w-2xl p-4 md:p-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-[20px] md:text-2xl font-bold mb-1">Change User Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Find a user, set or generate a new password, and they&apos;ll be emailed the new password automatically.
        </p>

        {!selectedUser ? (
          <div>
            <label className="block text-sm font-medium mb-1">Search user by name or email</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Start typing a name or email..."
              className="w-full border px-3 py-2 rounded-lg outline-none border-gray-400 focus:ring-2 focus:ring-blue-500 text-[14px] md:text-base"
              autoFocus
            />

            <div className="mt-3 border border-gray-200 rounded-lg divide-y min-h-[40px]">
              {searching ? (
                <div className="p-3 text-sm text-gray-500">Searching...</div>
              ) : searchTerm.trim().length > 0 && searchTerm.trim().length < 2 ? (
                <div className="p-3 text-sm text-gray-400">Keep typing to search…</div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-sm text-gray-400">
                  {searchTerm ? "No users found." : "Results will appear here."}
                </div>
              ) : (
                searchResults.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className="w-full text-left p-3 hover:bg-blue-50 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-medium text-sm text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <span className="text-xs capitalize bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {user.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-sm text-gray-600">{selectedUser.email}</div>
                <span className="inline-block mt-1 text-xs capitalize bg-white border border-blue-200 text-blue-700 px-2 py-0.5 rounded">
                  {selectedUser.role}
                </span>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="text-sm text-blue-700 hover:underline shrink-0"
              >
                Change user
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to auto-generate a secure password"
                      className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  At least 6 characters. The user will be emailed this password and should change it after logging in.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded bg-red-100 border border-red-400 text-red-700 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                {submitting ? "Updating..." : "Change Password & Email User"}
              </button>
            </form>

            {result && (
              <div
                className={`mt-4 p-4 rounded-lg border text-sm ${
                  result.emailSent
                    ? "bg-green-50 border-green-300 text-green-800"
                    : "bg-yellow-50 border-yellow-300 text-yellow-800"
                }`}
              >
                <p className="font-semibold mb-1">{result.message}</p>
                {!result.emailSent && (
                  <p className="mb-2">
                    The password was changed, but the notification email could not be sent. Share it with the user manually.
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <code className="px-2 py-1 bg-white border rounded font-mono text-gray-900">
                    {result.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyPassword(result.temporaryPassword)}
                    className="text-xs px-2 py-1 bg-white border rounded hover:bg-gray-50"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
