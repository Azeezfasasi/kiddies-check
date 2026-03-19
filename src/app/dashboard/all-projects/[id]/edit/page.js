"use client"
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'


export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id

  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    category: '',
    location: '',
    budget: '',
    startDate: '',
    expectedEndDate: '',
    projectStatus: 'planning',
    clientName: '',
    teamLead: '',
    teamMembers: '',
    featuredImage: null,
    featuredImagePreview: '',
    galleryImages: [],
    galleryImagePreviews: [],
    technologies: '',
    materialsUsed: '',
    completion: 0,
    projectHighlights: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [existingFeaturedImage, setExistingFeaturedImage] = useState(null)
  const [existingGalleryImages, setExistingGalleryImages] = useState([])

  // Load project data from backend on mount
  useEffect(() => {
    async function fetchProject() {
      setLoading(true);
      try {
        const res = await fetch(`/api/project/${projectId}`);
        const data = await res.json();
        if (data.success && data.project) {
          setFormData({
            projectName: data.project.projectName,
            projectDescription: data.project.projectDescription || '',
            category: data.project.category,
            location: data.project.location,
            budget: data.project.budget,
            startDate: data.project.startDate ? data.project.startDate.substring(0, 10) : '',
            expectedEndDate: data.project.expectedEndDate ? data.project.expectedEndDate.substring(0, 10) : '',
            projectStatus: data.project.projectStatus,
            clientName: data.project.clientName || '',
            teamLead: data.project.teamLead || '',
            teamMembers: (data.project.teamMembers || []).join(', '),
            featuredImage: null,
            featuredImagePreview: data.project.featuredImage || '',
            galleryImages: [],
            galleryImagePreviews: data.project.galleryImages || [],
            technologies: (data.project.technologies || []).join(', '),
            materialsUsed: (data.project.materialsUsed || []).join(', '),
            completion: data.project.completion,
            projectHighlights: data.project.projectHighlights || ''
          });
          setExistingFeaturedImage(data.project.featuredImage || null);
          setExistingGalleryImages(data.project.galleryImages || []);
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load project' });
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function handleImageChange(e) {
    const { name, files } = e.target
    if (name === 'featuredImage') {
      const file = files?.[0]
      if (file) {
        setFormData(prev => ({ ...prev, featuredImage: file }))
        const reader = new FileReader()
        reader.onload = (event) => {
          setFormData(prev => ({
            ...prev,
            featuredImagePreview: event.target?.result || ''
          }))
        }
        reader.readAsDataURL(file)
      }
    } else if (name === 'galleryImages') {
      const fileList = Array.from(files || [])
      setFormData(prev => ({ ...prev, galleryImages: fileList }))
      
      // Generate previews
      const previews = []
      let loadedCount = 0
      
      fileList.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          previews.push(event.target?.result || '')
          loadedCount++
          if (loadedCount === fileList.length) {
            setFormData(prev => ({
              ...prev,
              galleryImagePreviews: previews
            }))
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  function removeGalleryImage(index) {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
      galleryImagePreviews: prev.galleryImagePreviews.filter((_, i) => i !== index)
    }))
  }

  function removeExistingFeaturedImage() {
    setExistingFeaturedImage(null);
    setFormData(prev => ({
      ...prev,
      featuredImagePreview: ''
    }));
  }

  function removeExistingGalleryImage(index) {
    const updatedImages = existingGalleryImages.filter((_, i) => i !== index);
    setExistingGalleryImages(updatedImages);
    setFormData(prev => ({
      ...prev,
      galleryImagePreviews: updatedImages
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const data = new FormData();
      // Prepare fields for backend (convert comma separated to arrays)
      const fields = {
        ...formData,
        teamMembers: formData.teamMembers
          ? formData.teamMembers.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        technologies: formData.technologies
          ? formData.technologies.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        materialsUsed: formData.materialsUsed
          ? formData.materialsUsed.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        budget: formData.budget ? Number(formData.budget) : 0,
        completion: formData.completion ? Number(formData.completion) : 0,
        // Send existing gallery images that weren't removed
        existingGalleryImages: existingGalleryImages
      };
      delete fields.featuredImage;
      delete fields.galleryImages;
      delete fields.featuredImagePreview;
      delete fields.galleryImagePreviews;
      data.append('fields', JSON.stringify(fields));
      if (formData.featuredImage) {
        data.append('featuredImage', formData.featuredImage);
      }
      if (formData.galleryImages && formData.galleryImages.length > 0) {
        formData.galleryImages.forEach((file) => data.append('galleryImages', file));
      }
      const response = await fetch(`/api/project/${projectId}`, { method: 'PUT', body: data });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Project updated successfully!' });
        setTimeout(() => router.push('/dashboard/all-projects'), 2000);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update project' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
    <div className="min-h-screen bg-gray-50 py-6 px-0 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard/all-projects" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-flex items-center gap-1">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Projects
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Project</h1>
            <p className="mt-2 text-gray-600">Update project details and information.</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm space-y-6 p-6 md:p-8">
          {/* Project Basics */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">Project Basics</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">Project Name <span className='text-red-500 font-bold'>*</span></label>
                <input type="text" id="projectName" name="projectName" value={formData.projectName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="e.g., Commercial Complex" />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category <span className='text-red-500 font-bold'>*</span></label>
                <select id="category" name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                  <option value="">Select category</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="renovation">Renovation</option>
                </select>
              </div>
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input type="text" id="clientName" name="clientName" value={formData.clientName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="Client name" />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="e.g., Lagos, Nigeria" />
              </div>
            </div>
          </fieldset>

          {/* Description */}
          <div>
            <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
            <textarea id="projectDescription" name="projectDescription" value={formData.projectDescription} onChange={handleInputChange} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" placeholder="Describe the project in detail..." />
          </div>

          {/* Timeline & Budget */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">Timeline & Budget</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label htmlFor="expectedEndDate" className="block text-sm font-medium text-gray-700 mb-2">Expected End Date</label>
                <input type="date" id="expectedEndDate" name="expectedEndDate" value={formData.expectedEndDate} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
              </div>
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">Budget (₦)</label>
                <input type="number" id="budget" name="budget" value={formData.budget} onChange={handleInputChange} step="1000" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="0" />
              </div>
              <div>
                <label htmlFor="completion" className="block text-sm font-medium text-gray-700 mb-2">Completion % (0-100)</label>
                <input type="number" id="completion" name="completion" value={formData.completion} onChange={handleInputChange} min="0" max="100" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
              </div>
            </div>
          </fieldset>

          {/* Status */}
          <div>
            <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700 mb-2">Project Status <span className='text-red-500 font-bold'>*</span></label>
            <select id="projectStatus" name="projectStatus" value={formData.projectStatus} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on hold">On Hold</option>
            </select>
          </div>

          {/* Team */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">Team</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="teamLead" className="block text-sm font-medium text-gray-700 mb-2">Team Lead</label>
                <input type="text" id="teamLead" name="teamLead" value={formData.teamLead} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="Lead name" />
              </div>
              <div>
                <label htmlFor="teamMembers" className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                <input type="text" id="teamMembers" name="teamMembers" value={formData.teamMembers} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" placeholder="Separate by comma" />
              </div>
            </div>
          </fieldset>

          {/* Technologies & Materials */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-2">Technologies & Methods</label>
                <textarea id="technologies" name="technologies" value={formData.technologies} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" placeholder="e.g., BIM, sustainable materials, etc." />
              </div>
              <div>
                <label htmlFor="materialsUsed" className="block text-sm font-medium text-gray-700 mb-2">Materials Used</label>
                <textarea id="materialsUsed" name="materialsUsed" value={formData.materialsUsed} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" placeholder="e.g., concrete, steel, etc." />
              </div>
            </div>
          </fieldset>

          {/* Highlights */}
          <div>
            <label htmlFor="projectHighlights" className="block text-sm font-medium text-gray-700 mb-2">Project Highlights</label>
            <textarea id="projectHighlights" name="projectHighlights" value={formData.projectHighlights} onChange={handleInputChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" placeholder="Key achievements, awards, special features..." />
          </div>

          {/* Images */}
          <fieldset>
            <legend className="text-lg font-semibold text-gray-900 mb-4">Media</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="featuredImage" className="block text-sm font-medium text-gray-700 mb-2">Featured Image</label>
                {formData.featuredImagePreview && (
                  <div className="mb-4 relative max-w-xs">
                    <img src={formData.featuredImagePreview} alt="Featured image preview" className="max-h-48 rounded-lg border border-gray-300" />
                    <button
                      type="button"
                      onClick={() => {
                        if (existingFeaturedImage) {
                          removeExistingFeaturedImage();
                        } else {
                          setFormData(prev => ({ ...prev, featuredImage: null, featuredImagePreview: '' }));
                        }
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input type="file" id="featuredImage" name="featuredImage" onChange={handleImageChange} accept="image/*" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                {formData.featuredImage && !formData.featuredImagePreview && <p className="text-sm text-green-600 mt-2">✓ {formData.featuredImage.name}</p>}
              </div>
              <div>
                <label htmlFor="galleryImages" className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (multiple)</label>
                <input type="file" id="galleryImages" name="galleryImages" onChange={handleImageChange} accept="image/*" multiple className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                {formData.galleryImagePreviews && formData.galleryImagePreviews.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Gallery Images ({formData.galleryImagePreviews.length})</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.galleryImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img src={preview} alt={`Gallery image ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-gray-300" />
                          <button
                            type="button"
                            onClick={() => {
                              if (preview.startsWith('http')) {
                                removeExistingGalleryImage(idx);
                              } else {
                                removeGalleryImage(idx);
                              }
                            }}
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-lg"
                          >
                            <span className="text-white text-sm font-medium">Remove</span>
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {formData.galleryImages[idx]?.name || 'Existing image'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </fieldset>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t">
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white font-medium py-2 px-1 md:px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/dashboard/all-projects" className="flex-1 bg-red-200 text-gray-700 font-medium py-2 px-1 md:px-4 rounded-md hover:bg-red-300 text-center focus:outline-none focus:ring-2 focus:ring-red-500">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
    </ProtectedRoute>
  )
}
