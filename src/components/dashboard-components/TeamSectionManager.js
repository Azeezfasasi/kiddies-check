'use client';

import { useEffect, useState } from 'react';
import { Loader, Edit2, Trash2, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamSectionManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    photo: '',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/team');
      const data = await response.json();

      if (data.success && data.members) {
        const sortedMembers = [...data.members].sort((a, b) => (a.order || 0) - (b.order || 0));
        setMembers(sortedMembers);
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (member = null) => {
    if (member) {
      setEditingId(member._id);
      setFormData({
        name: member.name,
        position: member.position,
        bio: member.bio || '',
        photo: member.photo,
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', position: '', bio: '', photo: '' });
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', position: '', bio: '', photo: '' });
  };

  const uploadPhotoToCloudinary = async (file) => {
    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'team');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const data = await response.json();
      if (data.success) {
        setFormData((prev) => ({ ...prev, photo: data.url }));
        toast.success('Photo uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadPhotoToCloudinary(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.position || !formData.photo) {
      toast.error('Please fill in name, position, and upload a photo');
      return;
    }

    try {
      if (editingId) {
        const response = await fetch('/api/team', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: editingId,
            name: formData.name,
            position: formData.position,
            bio: formData.bio,
            photo: formData.photo,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Team member updated successfully');
          handleModalClose();
          fetchMembers();
        } else {
          toast.error(data.error || 'Failed to update');
        }
      } else {
        const response = await fetch('/api/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Team member added successfully');
          handleModalClose();
          fetchMembers();
        } else {
          toast.error(data.error || 'Failed to create');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      try {
        const response = await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
          toast.success('Team member deleted successfully');
          fetchMembers();
        } else {
          toast.error(data.error || 'Failed to delete');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to delete team member');
      }
    }
  };

  const handleReorder = async (id, direction) => {
    const currentIndex = members.findIndex((m) => m._id === id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === members.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newMembers = [...members];
    [newMembers[currentIndex], newMembers[newIndex]] = [newMembers[newIndex], newMembers[currentIndex]];

    try {
      const response = await fetch('/api/team', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          memberIds: newMembers.map((m) => m._id),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMembers(newMembers);
        toast.success('Team member reordered');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to reorder');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleModalOpen()}
        className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800"
      >
        <Plus className="w-4 h-4" /> Add Team Member
      </button>

      {members.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No team members found</p>
      ) : (
        <div className="space-y-3">
          {members.map((member, idx) => (
            <div key={member._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.position}</p>
                  {member.bio && <p className="text-sm text-gray-700 mt-2">{member.bio}</p>}
                </div>
                {member.photo && (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover ml-4"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleModalOpen(member)}
                  className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>

                <button
                  onClick={() => handleDelete(member._id)}
                  className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>

                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => handleReorder(member._id, 'up')}
                    disabled={idx === 0}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleReorder(member._id, 'down')}
                    disabled={idx === members.length - 1}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button onClick={handleModalClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Engr. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Lead Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  placeholder="Enter member bio (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.photo && (
                  <img
                    src={formData.photo}
                    alt="Preview"
                    className="w-20 h-20 rounded-full object-cover mt-2"
                  />
                )}
                {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
