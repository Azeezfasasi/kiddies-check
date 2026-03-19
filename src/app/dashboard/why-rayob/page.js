'use client'

import React, { useState, useEffect } from 'react'
import { Edit2, Trash2, Plus, ChevronUp, ChevronDown, Save, X } from 'lucide-react'

const AVAILABLE_ICONS = ['Zap', 'Target', 'Shield', 'Users', 'Briefcase', 'CheckCircle', 'Handshake']

export default function page() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingHeading, setEditingHeading] = useState(false)
  const [editingCTA, setEditingCTA] = useState(false)
  const [editingReason, setEditingReason] = useState(null)
  const [addingNewReason, setAddingNewReason] = useState(false)

  const [headingData, setHeadingData] = useState({ heading: '', subheading: '' })
  const [ctaData, setCtaData] = useState({
    ctaHeading: '',
    ctaDescription: '',
    ctaButton1: { label: '', href: '' },
    ctaButton2: { label: '', href: '' },
  })
  const [reasonData, setReasonData] = useState({
    title: '',
    description: '',
    icon: 'Zap',
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/why-rayob')
      const result = await response.json()
      if (result.success) {
        setContent(result.data)
        setHeadingData({
          heading: result.data.heading,
          subheading: result.data.subheading,
        })
        setCtaData({
          ctaHeading: result.data.ctaHeading,
          ctaDescription: result.data.ctaDescription,
          ctaButton1: result.data.ctaButton1,
          ctaButton2: result.data.ctaButton2,
        })
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateHeading = async () => {
    try {
      const response = await fetch('/api/why-rayob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-heading',
          ...headingData,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setContent(result.data)
        setEditingHeading(false)
        alert('Heading updated successfully!')
      }
    } catch (error) {
      console.error('Error updating heading:', error)
      alert('Error updating heading')
    }
  }

  const updateCTA = async () => {
    try {
      const response = await fetch('/api/why-rayob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-cta',
          ...ctaData,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setContent(result.data)
        setEditingCTA(false)
        alert('CTA updated successfully!')
      }
    } catch (error) {
      console.error('Error updating CTA:', error)
      alert('Error updating CTA')
    }
  }

  const createReason = async () => {
    if (!reasonData.title.trim() || !reasonData.description.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/why-rayob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-reason',
          ...reasonData,
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchContent()
        setAddingNewReason(false)
        setReasonData({ title: '', description: '', icon: 'Zap' })
        alert('Reason added successfully!')
      }
    } catch (error) {
      console.error('Error creating reason:', error)
      alert('Error creating reason')
    }
  }

  const updateReason = async (reasonId) => {
    try {
      const response = await fetch('/api/why-rayob', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-reason',
          reasonId,
          data: {
            title: editingReason.title,
            description: editingReason.description,
            icon: editingReason.icon,
          },
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchContent()
        setEditingReason(null)
        alert('Reason updated successfully!')
      }
    } catch (error) {
      console.error('Error updating reason:', error)
      alert('Error updating reason')
    }
  }

  const deleteReason = async (reasonId) => {
    if (!window.confirm('Are you sure you want to delete this reason?')) {
      return
    }

    try {
      const response = await fetch('/api/why-rayob', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reasonId }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchContent()
        alert('Reason deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting reason:', error)
      alert('Error deleting reason')
    }
  }

  const moveReason = async (index, direction) => {
    if (!content.reasons) return

    const newReasons = [...content.reasons]
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= newReasons.length) return

    ;[newReasons[index], newReasons[newIndex]] = [newReasons[newIndex], newReasons[index]]

    try {
      const response = await fetch('/api/why-rayob', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder',
          reasons: newReasons.map((r, idx) => ({
            _id: r._id,
            order: idx + 1,
            id: idx + 1,
          })),
        }),
      })

      const result = await response.json()
      if (result.success) {
        await fetchContent()
      }
    } catch (error) {
      console.error('Error reordering reasons:', error)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Manage Why Choose Kiddies Check</h1>

      {/* Heading Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Heading & Subheading</h2>
          <button
            onClick={() => (editingHeading ? updateHeading() : setEditingHeading(true))}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingHeading ? <Save size={18} /> : <Edit2 size={18} />}
            {editingHeading ? 'Save' : 'Edit'}
          </button>
        </div>

        {editingHeading ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heading
              </label>
              <input
                type="text"
                value={headingData.heading}
                onChange={(e) =>
                  setHeadingData({ ...headingData, heading: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subheading
              </label>
              <textarea
                value={headingData.subheading}
                onChange={(e) =>
                  setHeadingData({ ...headingData, subheading: e.target.value })
                }
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600">Heading: {content.heading}</p>
            <p className="text-sm text-gray-600">Subheading: {content.subheading}</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Call to Action</h2>
          <button
            onClick={() => (editingCTA ? updateCTA() : setEditingCTA(true))}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {editingCTA ? <Save size={18} /> : <Edit2 size={18} />}
            {editingCTA ? 'Save' : 'Edit'}
          </button>
        </div>

        {editingCTA ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Heading
              </label>
              <input
                type="text"
                value={ctaData.ctaHeading}
                onChange={(e) =>
                  setCtaData({ ...ctaData, ctaHeading: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTA Description
              </label>
              <textarea
                value={ctaData.ctaDescription}
                onChange={(e) =>
                  setCtaData({ ...ctaData, ctaDescription: e.target.value })
                }
                rows="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button 1 Label
                </label>
                <input
                  type="text"
                  value={ctaData.ctaButton1.label}
                  onChange={(e) =>
                    setCtaData({
                      ...ctaData,
                      ctaButton1: { ...ctaData.ctaButton1, label: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button 1 Link
                </label>
                <input
                  type="text"
                  value={ctaData.ctaButton1.href}
                  onChange={(e) =>
                    setCtaData({
                      ...ctaData,
                      ctaButton1: { ...ctaData.ctaButton1, href: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button 2 Label
                </label>
                <input
                  type="text"
                  value={ctaData.ctaButton2.label}
                  onChange={(e) =>
                    setCtaData({
                      ...ctaData,
                      ctaButton2: { ...ctaData.ctaButton2, label: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button 2 Link
                </label>
                <input
                  type="text"
                  value={ctaData.ctaButton2.href}
                  onChange={(e) =>
                    setCtaData({
                      ...ctaData,
                      ctaButton2: { ...ctaData.ctaButton2, href: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 space-y-2">
            <p>Heading: {content.ctaHeading}</p>
            <p>Description: {content.ctaDescription}</p>
            <p>Button 1: {content.ctaButton1?.label}</p>
            <p>Button 2: {content.ctaButton2?.label}</p>
          </div>
        )}
      </div>

      {/* Reasons Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Reasons ({content.reasons?.length || 0})</h2>
          {!addingNewReason && (
            <button
              onClick={() => setAddingNewReason(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              <Plus size={18} />
              Add New Reason
            </button>
          )}
        </div>

        {/* Add New Reason Form */}
        {addingNewReason && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Add New Reason</h3>
              <button
                onClick={() => {
                  setAddingNewReason(false)
                  setReasonData({ title: '', description: '', icon: 'Zap' })
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={reasonData.title}
                onChange={(e) =>
                  setReasonData({ ...reasonData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={reasonData.description}
                onChange={(e) =>
                  setReasonData({ ...reasonData, description: e.target.value })
                }
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon
              </label>
              <select
                value={reasonData.icon}
                onChange={(e) =>
                  setReasonData({ ...reasonData, icon: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {AVAILABLE_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={createReason}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create Reason
            </button>
          </div>
        )}

        {/* Reasons List */}
        <div className="space-y-4">
          {content.reasons && content.reasons.length > 0 ? (
            content.reasons
              .sort((a, b) => a.order - b.order)
              .map((reason, index) => (
                <div key={reason._id} className="border border-gray-200 rounded-lg p-4">
                  {editingReason?._id === reason._id ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-900">Edit Reason</h4>
                        <button
                          onClick={() => setEditingReason(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editingReason.title}
                        onChange={(e) =>
                          setEditingReason({ ...editingReason, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Title"
                      />
                      <textarea
                        value={editingReason.description}
                        onChange={(e) =>
                          setEditingReason({
                            ...editingReason,
                            description: e.target.value,
                          })
                        }
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Description"
                      />
                      <select
                        value={editingReason.icon}
                        onChange={(e) =>
                          setEditingReason({ ...editingReason, icon: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {AVAILABLE_ICONS.map((icon) => (
                          <option key={icon} value={icon}>
                            {icon}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateReason(reason._id)}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {index + 1}. {reason.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                          <p className="text-xs text-gray-500 mt-2">Icon: {reason.icon}</p>
                        </div>
                        <div className="flex gap-2">
                          {index > 0 && (
                            <button
                              onClick={() => moveReason(index, 'up')}
                              className="p-2 hover:bg-gray-100 rounded"
                            >
                              <ChevronUp size={18} className="text-blue-600" />
                            </button>
                          )}
                          {index < (content.reasons?.length || 0) - 1 && (
                            <button
                              onClick={() => moveReason(index, 'down')}
                              className="p-2 hover:bg-gray-100 rounded"
                            >
                              <ChevronDown size={18} className="text-blue-600" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setEditingReason(reason)}
                          className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteReason(reason._id)}
                          className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
          ) : (
            <p className="text-gray-600 text-center py-4">No reasons yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
