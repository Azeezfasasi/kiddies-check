'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Loader, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParentChildrenModal({ parent, schoolId, userId, onClose }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students assigned to this parent
      const response = await fetch(
        `/api/teacher/students?schoolId=${schoolId}&parentId=${parent._id}`,
        {
          headers: {
            'x-user-id': userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data.data || []);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError(err.message || 'Failed to load children');
      toast.error(err.message || 'Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={28} />
            Children of {parent.firstName} {parent.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader className="text-purple-600 animate-spin mb-4" size={48} />
              <p className="text-gray-600">Loading children...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Children Found</h3>
              <p className="text-gray-600">
                No students have been assigned to this parent yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {children.map((child) => (
                <div
                  key={child._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {child.firstName?.charAt(0)}
                      {child.lastName?.charAt(0)}
                    </div>

                    {/* Child Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {child.firstName} {child.lastName}
                      </h3>
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {child.class && (
                          <div>
                            <p className="text-gray-600 font-medium">Class</p>
                            <p className="text-gray-900">{child.class.name}</p>
                          </div>
                        )}
                        {child.gender && (
                          <div>
                            <p className="text-gray-600 font-medium">Gender</p>
                            <p className="text-gray-900 capitalize">{child.gender}</p>
                          </div>
                        )}
                        {child.email && (
                          <div>
                            <p className="text-gray-600 font-medium">Email</p>
                            <p className="text-gray-900 break-all">{child.email}</p>
                          </div>
                        )}
                        {child.dateOfBirth && (
                          <div>
                            <p className="text-gray-600 font-medium">Date of Birth</p>
                            <p className="text-gray-900">
                              {new Date(child.dateOfBirth).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mt-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            child.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {child.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Summary */}
          {!loading && children.length > 0 && (
            <div className="mt-6 p-4 bg-purple-50 rounded-lg text-center">
              <p className="text-gray-700">
                Total: <span className="font-bold text-purple-900">{children.length}</span> student
                {children.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
