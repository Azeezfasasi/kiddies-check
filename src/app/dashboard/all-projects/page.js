"use client"
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'

// Backend integration: fetch projects from API

function getStatusColor(status) {
  switch (status) {
    case 'planning': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'in-progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
    case 'completed': return 'bg-green-50 text-green-700 border-green-200'
    case 'on-hold': return 'bg-red-50 text-red-700 border-red-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function getCategoryBadge(category) {
  const colors = {
    residential: 'bg-indigo-100 text-indigo-800',
    commercial: 'bg-purple-100 text-purple-800',
    industrial: 'bg-orange-100 text-orange-800',
    infrastructure: 'bg-green-100 text-green-800',
    renovation: 'bg-pink-100 text-pink-800'
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

export default function AllProjectsPage() {
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Fetch projects from backend
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch('/api/project');
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
        } else {
          setProjects([]);
        }
      } catch (err) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = projects;
    if (searchTerm) {
      filtered = filtered.filter(p => (p.projectName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.location || '').toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.projectStatus === filterStatus);
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }
    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory, projects]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/project/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setProjects(projects.filter(p => p._id !== id));
        setMessage({ type: 'success', text: 'Project deleted successfully!' });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      let result = { message: 'Failed to delete project' };
      try {
        result = await response.json();
      } catch (e) {
        const text = await response.text();
        result = { message: text };
      }
      setMessage({ type: 'error', text: result.message || 'Failed to delete project' });
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id) {
    const project = projects.find(p => p._id === id);
    if (!project) return;
    setLoading(true);
    try {
      // PATCH to disable/enable project
      const response = await fetch(`/api/project/${id}?disable=${project.isDisabled ? '0' : '1'}`, { method: 'PATCH' });
      if (response.ok) {
        setProjects(projects.map(p => p._id === id ? { ...p, isDisabled: !p.isDisabled, projectStatus: !p.isDisabled ? 'disabled' : 'planning' } : p));
        setMessage({ type: 'success', text: `Project ${!project.isDisabled ? 'disabled' : 'enabled'} successfully!` });
        setTimeout(() => setMessage(null), 3000);
        return;
      }
      let result = { message: 'Failed to update project' };
      try {
        result = await response.json();
      } catch (e) {
        const text = await response.text();
        result = { message: text };
      }
      setMessage({ type: 'error', text: result.message || 'Failed to update project' });
    } catch (err) {
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
    <div className="min-h-screen bg-gray-50 py-6 px-0 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">All Projects</h1>
            <p className="mt-2 text-gray-600">Manage and view all construction projects.</p>
          </div>
          <Link href="/dashboard/add-projects" className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2 rounded-md hover:bg-indigo-700 whitespace-nowrap">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Project
          </Link>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message.text}
          </div>
        )}

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6 space-y-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">Search Projects</label>
            <input type="text" id="search" placeholder="Search by project name or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select id="status-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                <option value="all">All Statuses</option>
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>

            <div>
              <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
              <select id="category-filter" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                <option value="all">All Categories</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="renovation">Renovation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">Showing <span className="font-semibold">{filteredProjects.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold">{Math.min(endIndex, filteredProjects.length)}</span> of <span className="font-semibold">{filteredProjects.length}</span> projects</p>
        </div>

        {/* Projects Table (Desktop) */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Project Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Budget</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Progress</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProjects.length > 0 ? (
                paginatedProjects.map(project => (
                  <tr key={project._id} className={`hover:bg-gray-50 ${project.isDisabled ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.projectName}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryBadge(project.category || '')}`}>
                        {(project.category || '').charAt(0).toUpperCase() + (project.category || '').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{project.location}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-md border text-xs font-medium ${getStatusColor(project.projectStatus || '')}`}>
                        {(project.projectStatus || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₦{(project.budget / 1000000).toFixed(1)}M</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${project.completion}%` }} />
                        </div>
                        <span className="text-xs font-medium">{project.completion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm space-y-2">
                      <div className="flex gap-2">
                        <Link href={`/dashboard/all-projects/${project._id}/edit`} className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs font-medium">
                          Edit
                        </Link>
                        <button onClick={() => handleToggle(project._id)} disabled={loading} className={`px-3 py-1 rounded text-xs font-medium ${!project.isDisabled ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {!project.isDisabled ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => handleDelete(project._id)} disabled={loading} className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs font-medium">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-600">No projects found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Desktop) */}
        {filteredProjects.length > 0 && (
          <div className="hidden lg:flex items-center justify-between mt-6 bg-white rounded-lg shadow-sm p-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-2 rounded-md text-sm font-medium ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {page}
                </button>
              ))}
            </div>

            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Projects Cards (Mobile/Tablet) */}
        <div className="lg:hidden space-y-4">
          {paginatedProjects.length > 0 ? (
            paginatedProjects.map(project => (
              <div key={project._id} className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 ${project.isDisabled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{project.projectName}</h3>
                    <p className="text-sm text-gray-600">{project.location}</p>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(project.category || '')}`}>
                    {(project.category || '').charAt(0).toUpperCase() + (project.category || '').slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-block px-3 py-1 rounded-md border text-xs font-medium ${getStatusColor(project.projectStatus || '')}`}>
                      {(project.projectStatus || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium">₦{(project.budget / 1000000).toFixed(1)}M</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium">{project.completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${project.completion}%` }} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/all-projects/${project._id}/edit`} className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded text-sm font-medium text-center hover:bg-blue-100">
                    Edit
                  </Link>
                  <button onClick={() => handleToggle(project._id)} disabled={loading} className={`flex-1 px-3 py-2 rounded text-sm font-medium ${!project.isDisabled ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {!project.isDisabled ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(project._id)} disabled={loading} className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100">
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">No projects found</div>
          )}
        </div>

        {/* Pagination (Mobile/Tablet) */}
        {filteredProjects.length > 0 && (
          <div className="lg:hidden mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer">
                ← Previous
              </button>
              <span className="text-sm font-medium text-gray-700 cursor-pointer">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer">
                Next →
              </button>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-2 py-1 rounded-md text-sm ${currentPage === page ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  )
}
