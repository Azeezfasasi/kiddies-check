'use client';

import { useEffect, useState } from 'react';
import { Loader, Edit2, Trash2, ChevronUp, ChevronDown, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryMilestonesManager() {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    title: '',
    description: '',
  });

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/milestones');
      const data = await response.json();

      if (data.success && data.milestones) {
        const sortedMilestones = [...data.milestones].sort((a, b) => (a.order || 0) - (b.order || 0));
        setMilestones(sortedMilestones);
      }
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpen = (milestone = null) => {
    if (milestone) {
      setEditingId(milestone._id);
      setFormData({
        year: milestone.year,
        title: milestone.title,
        description: milestone.description,
      });
    } else {
      setEditingId(null);
      setFormData({ year: '', title: '', description: '' });
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ year: '', title: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.year || !formData.title || !formData.description) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      if (editingId) {
        // Update existing milestone
        const response = await fetch('/api/milestones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId: editingId,
            year: formData.year,
            title: formData.title,
            description: formData.description,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Milestone updated successfully');
          handleModalClose();
          fetchMilestones();
        } else {
          toast.error(data.error || 'Failed to update milestone');
        }
      } else {
        // Create new milestone
        const response = await fetch('/api/milestones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Milestone created successfully');
          handleModalClose();
          fetchMilestones();
        } else {
          toast.error(data.error || 'Failed to create milestone');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save milestone');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      try {
        const response = await fetch(`/api/milestones?id=${id}`, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
          toast.success('Milestone deleted successfully');
          fetchMilestones();
        } else {
          toast.error(data.error || 'Failed to delete');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to delete milestone');
      }
    }
  };

  const handleReorder = async (id, direction) => {
    const currentIndex = milestones.findIndex((m) => m._id === id);
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === milestones.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newMilestones = [...milestones];
    [newMilestones[currentIndex], newMilestones[newIndex]] = [newMilestones[newIndex], newMilestones[currentIndex]];

    try {
      const response = await fetch('/api/milestones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reorder: true,
          milestoneIds: newMilestones.map((m) => m._id),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMilestones(newMilestones);
        toast.success('Milestone reordered');
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
        <Plus className="w-4 h-4" /> Add Milestone
      </button>

      {milestones.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No milestones found</p>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone, idx) => (
            <div key={milestone._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Year: {milestone.year}</p>
                  <h3 className="text-lg font-semibold text-gray-800">{milestone.title}</h3>
                  <p className="text-sm text-gray-700 mt-2">{milestone.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => handleModalOpen(milestone)}
                  className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>

                <button
                  onClick={() => handleDelete(milestone._id)}
                  className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>

                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => handleReorder(milestone._id, 'up')}
                    disabled={idx === 0}
                    className="p-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleReorder(milestone._id, 'down')}
                    disabled={idx === milestones.length - 1}
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
                {editingId ? 'Edit Milestone' : 'Add Milestone'}
              </h2>
              <button onClick={handleModalClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Company Founded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  placeholder="Enter milestone description"
                />
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
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
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
