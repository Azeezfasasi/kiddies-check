'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Loader, AlertCircle, Search, Link2, Unlink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParentChildrenModal({ parent, schoolId, userId, onClose, onChildrenChange = undefined }) {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Linking a pupil to this parent
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [pupils, setPupils] = useState([]);
  const [loadingPupils, setLoadingPupils] = useState(false);
  const [pupilSearch, setPupilSearch] = useState('');
  const [selectedPupilId, setSelectedPupilId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchPupils = async () => {
    try {
      setLoadingPupils(true);
      const response = await fetch(`/api/teacher/students?schoolId=${schoolId}`, {
        headers: { 'x-user-id': userId },
      });
      if (!response.ok) throw new Error('Failed to load pupils');
      const data = await response.json();
      setPupils(data.data || []);
    } catch (err) {
      console.error('Error fetching pupils:', err);
      toast.error(err.message || 'Failed to load pupils');
    } finally {
      setLoadingPupils(false);
    }
  };

  const openLinkForm = () => {
    setShowLinkForm(true);
    setSelectedPupilId(null);
    setPupilSearch('');
    if (pupils.length === 0) fetchPupils();
  };

  // Same endpoint the pupils page uses; parentId null removes the link.
  const setPupilParent = async (pupilId, parentId) => {
    const response = await fetch(`/api/teacher/students/${pupilId}/parent?schoolId=${schoolId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ parentId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update parent link');
    return data;
  };

  const handleLinkPupil = async () => {
    const pupil = pupils.find((p) => p._id === selectedPupilId);
    if (!pupil) return;
    try {
      setSavingId(pupil._id);
      await setPupilParent(pupil._id, parent._id);
      toast.success(`${pupil.firstName} ${pupil.lastName} linked to ${parent.firstName} ${parent.lastName}`);
      setShowLinkForm(false);
      setSelectedPupilId(null);
      setPupils((prev) => prev.map((p) => (p._id === pupil._id ? { ...p, parent } : p)));
      await fetchChildren();
    } catch (err) {
      console.error('Error linking pupil:', err);
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const handleUnlinkPupil = async (child) => {
    if (!window.confirm(`Unlink ${child.firstName} ${child.lastName} from ${parent.firstName} ${parent.lastName}?`)) return;
    try {
      setSavingId(child._id);
      await setPupilParent(child._id, null);
      toast.success(`${child.firstName} ${child.lastName} unlinked`);
      setPupils((prev) => prev.map((p) => (p._id === child._id ? { ...p, parent: null } : p)));
      await fetchChildren();
    } catch (err) {
      console.error('Error unlinking pupil:', err);
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const childIds = new Set(children.map((c) => c._id));
  const query = pupilSearch.trim().toLowerCase();
  const linkablePupils = pupils.filter(
    (p) =>
      !childIds.has(p._id) &&
      (!query ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.class?.name?.toLowerCase().includes(query))
  );
  const selectedPupil = pupils.find((p) => p._id === selectedPupilId);

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
      onChildrenChange?.((data.data || []).length);
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
          {/* Link a child */}
          {!showLinkForm ? (
            <div className="mb-6 flex justify-end">
              <button
                onClick={openLinkForm}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
              >
                <Link2 size={18} /> Link a Child
              </button>
            </div>
          ) : (
            <div className="mb-6 border border-purple-200 bg-purple-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-800">Link a pupil to {parent.firstName}</p>
                <button
                  onClick={() => setShowLinkForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search pupils by name or class..."
                  value={pupilSearch}
                  onChange={(e) => setPupilSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                />
              </div>

              {loadingPupils ? (
                <div className="flex justify-center py-6">
                  <Loader className="text-purple-600 animate-spin" size={24} />
                </div>
              ) : linkablePupils.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-6">
                  {pupils.length === 0 ? 'No pupils in this school yet' : 'No matching pupils'}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {linkablePupils.map((pupil) => (
                    <label
                      key={pupil._id}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="pupil"
                        checked={selectedPupilId === pupil._id}
                        onChange={() => setSelectedPupilId(pupil._id)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {pupil.firstName} {pupil.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {pupil.class?.name || 'No class'}
                          {pupil.parent && ` · Currently linked to ${pupil.parent.firstName} ${pupil.parent.lastName}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedPupil?.parent && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  {selectedPupil.firstName} is linked to {selectedPupil.parent.firstName} {selectedPupil.parent.lastName}.
                  Linking will replace that parent with {parent.firstName} {parent.lastName}.
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowLinkForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm font-medium bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkPupil}
                  disabled={!selectedPupilId || savingId !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {savingId && savingId === selectedPupilId && <Loader className="animate-spin" size={16} />}
                  Link Child
                </button>
              </div>
            </div>
          )}

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
                No pupils have been linked to this parent yet. Use &quot;Link a Child&quot; above.
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
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            child.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {child.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleUnlinkPupil(child)}
                          disabled={savingId !== null}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-medium disabled:opacity-50"
                          title="Remove this parent from the pupil"
                        >
                          {savingId === child._id ? <Loader className="animate-spin" size={14} /> : <Unlink size={14} />}
                          Unlink
                        </button>
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
