"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader, User, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";

export default function ParentAssignmentModal({ 
  studentData, 
  schoolId, 
  userId, 
  onClose, 
  onAssign 
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [parentList, setParentList] = useState([]);
  const [selectedParent, setSelectedParent] = useState(studentData?.parent?._id || null);
  const [loadingList, setLoadingList] = useState(false);
  const [assigningParent, setAssigningParent] = useState(false);
  const [currentParent, setCurrentParent] = useState(studentData?.parent || null);

  useEffect(() => {
    fetchParents();
  }, [searchQuery]);

  const fetchParents = async () => {
    try {
      setLoadingList(true);
      // This should fetch users with role='parent' that belong to the school
      // For now, we'll create a simple API endpoint
      const response = await fetch(
        `/api/teacher/parents?schoolId=${schoolId}&search=${searchQuery}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParentList(data.parents || []);
      }
    } catch (error) {
      console.error("Error fetching parents:", error);
      toast.error("Failed to fetch parents list");
    } finally {
      setLoadingList(false);
    }
  };

  const handleAssignParent = async () => {
    try {
      setAssigningParent(true);
      const response = await fetch(
        `/api/teacher/students/${studentData._id}/parent?schoolId=${schoolId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            parentId: selectedParent || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign parent");
      }

      toast.success(selectedParent ? "Parent assigned successfully" : "Parent removed successfully");
      setCurrentParent(data.student.parent);
      onAssign();
    } catch (error) {
      console.error("Error assigning parent:", error);
      toast.error(error.message);
    } finally {
      setAssigningParent(false);
    }
  };

  const handleRemoveParent = () => {
    setSelectedParent(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Assign Parent</h2>
            <p className="text-sm text-gray-600 mt-1">
              {studentData.firstName} {studentData.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current Parent (if assigned) */}
          {currentParent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Currently Assigned</p>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {currentParent.firstName.charAt(0)}{currentParent.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {currentParent.firstName} {currentParent.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{currentParent.email}</p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                  Assigned
                </span>
              </div>
            </div>
          )}

          {/* Search/Select Parent */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Search & Select Parent
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Parents List */}
          <div>
            {loadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : parentList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No parents found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {parentList.map((parent) => (
                  <label key={parent._id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors border border-gray-200">
                    <input
                      type="radio"
                      name="parent"
                      value={parent._id}
                      checked={selectedParent === parent._id}
                      onChange={(e) => setSelectedParent(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {parent.firstName.charAt(0)}{parent.lastName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">
                            {parent.firstName} {parent.lastName}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                            {parent.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{parent.email}</span>
                              </div>
                            )}
                            {parent.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{parent.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedParent && selectedParent !== currentParent?._id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Ready to Assign</p>
              <p className="text-sm text-gray-600">
                {parentList.find(p => p._id === selectedParent) && `${parentList.find(p => p._id === selectedParent).firstName} ${parentList.find(p => p._id === selectedParent).lastName}`} {' '}
                will be able to view this student's progress and feedback.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {selectedParent && selectedParent !== currentParent?._id && (
              <button
                onClick={handleRemoveParent}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignParent}
              disabled={assigningParent || (selectedParent === currentParent?._id)}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {assigningParent && <Loader className="w-4 h-4 animate-spin" />}
              {selectedParent === currentParent?._id ? "No Changes" : "Assign Parent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
