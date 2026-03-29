"use client";

import { useState, useEffect } from "react";
import { X, Mail, Phone, Building, Loader, Edit, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ParentProfileModal({ parentId, onClose }) {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchParentProfile();
  }, [parentId]);

  const fetchParentProfile = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      // Fetch parent user data
      const response = await fetch(`/api/users/${parentId}`, {
        headers: {
          "x-user-id": userId,
          "Authorization": `Bearer ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setParent(data.user);
        setEditData(data.user);
      }
    } catch (error) {
      console.error("Error fetching parent:", error);
      toast.error("Failed to load parent profile");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      const response = await fetch(`/api/users/${parentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email,
          phone: editData.phone,
          company: editData.company,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setParent(data.user);
      setIsEditing(false);
      toast.success("Parent profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading parent profile...</p>
        </div>
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center">
          <p className="text-red-600 font-semibold">Parent profile not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">Parent Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex items-start gap-4 pb-6 border-b">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
              {editData.firstName.charAt(0)}{editData.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-bold text-gray-800">
                {editData.firstName} {editData.lastName}
              </h3>
              <p className="text-sm text-gray-600 mt-1 capitalize">Parent Account</p>
              <p className="text-xs text-gray-500 mt-1 italic">
                Role: <span className="font-semibold">Parent</span>
              </p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>

          {/* Profile Information */}
          {isEditing ? (
            <div className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={editData.firstName}
                  onChange={(e) => handleEditChange("firstName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editData.lastName}
                  onChange={(e) => handleEditChange("lastName", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editData.phone || ""}
                  onChange={(e) => handleEditChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Company/Workplace
                </label>
                <input
                  type="text"
                  value={editData.company || ""}
                  onChange={(e) => handleEditChange("company", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData(parent);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Email</p>
                  <p className="text-gray-800 break-all">{parent.email}</p>
                </div>
              </div>

              {/* Phone */}
              {parent.phone && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Phone</p>
                    <p className="text-gray-800">{parent.phone}</p>
                  </div>
                </div>
              )}

              {/* Company */}
              {parent.company && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <Building className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Company/Workplace</p>
                    <p className="text-gray-800">{parent.company}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Account Status</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Status</p>
                <p className="text-gray-800 font-semibold capitalize">
                  {parent.isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Verification</p>
                <p className="text-gray-800 font-semibold">
                  {parent.isEmailVerified ? "Verified" : "Not Verified"}
                </p>
              </div>
              {parent.lastLogin && (
                <div className="col-span-2">
                  <p className="text-gray-600">Last Login</p>
                  <p className="text-gray-800 font-semibold">
                    {new Date(parent.lastLogin).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
