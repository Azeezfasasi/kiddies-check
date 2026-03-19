'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Edit2, Trash2, Eye, EyeOff, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Commet } from "react-loading-indicators";
import { ProtectedRoute } from '@/components/ProtectedRoute'

const ManageBlogPage = () => {
	const router = useRouter()
	const [posts, setPosts] = useState([])
	const [filteredPosts, setFilteredPosts] = useState([])
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [authorFilter, setAuthorFilter] = useState('all')
	const [sortBy, setSortBy] = useState('date-desc')
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [postToDelete, setPostToDelete] = useState(null)
	const [authors, setAuthors] = useState([])

	const postsPerPage = 10

	useEffect(() => {
		loadPosts()
		loadAuthors()
	}, [])

	const loadPosts = async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/blog')
			const data = await res.json()
			setPosts(data)
		} catch (error) {
			console.error('Failed to load posts:', error)
		} finally {
			setLoading(false)
		}
	}

	const loadAuthors = async () => {
		// Extract authors from posts
		try {
			const res = await fetch('/api/blog')
			const data = await res.json()
			const uniqueAuthors = [...new Set(data.map(post => post.author))]
			setAuthors(uniqueAuthors.map((name, idx) => ({ id: idx + 1, name })))
		} catch (error) {
			setAuthors([])
		}
	}

	useEffect(() => {
		let filtered = [...posts]
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase()
			filtered = filtered.filter(
				(post) =>
					post.postTitle?.toLowerCase().includes(query) ||
					post.content?.toLowerCase().includes(query) ||
					post.author?.toLowerCase().includes(query)
			)
		}
		if (statusFilter !== 'all') {
			filtered = filtered.filter((post) => post.status === statusFilter)
		}
		if (authorFilter !== 'all') {
			filtered = filtered.filter((post) => post.author === authors.find(a => a.id === parseInt(authorFilter))?.name)
		}
		if (sortBy === 'date-desc') {
			filtered.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate))
		} else if (sortBy === 'date-asc') {
			filtered.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate))
		} else if (sortBy === 'title-asc') {
			filtered.sort((a, b) => a.postTitle.localeCompare(b.postTitle))
		} else if (sortBy === 'title-desc') {
			filtered.sort((a, b) => b.postTitle.localeCompare(a.postTitle))
		}
		setFilteredPosts(filtered)
		setCurrentPage(1)
	}, [posts, searchQuery, statusFilter, authorFilter, sortBy, authors])

	const indexOfLastPost = currentPage * postsPerPage
	const indexOfFirstPost = indexOfLastPost - postsPerPage
	const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost)
	const totalPages = Math.ceil(filteredPosts.length / postsPerPage)

	const handleEdit = (postId) => {
		router.push(`/dashboard/manage-blog/${postId}`)
	}

	const handleStatusChange = useCallback(
		async (postId, newStatus) => {
			try {
				const res = await fetch(`/api/blog/${postId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status: newStatus })
				})
				if (res.ok) {
					loadPosts()
					console.log(`Post ${postId} status changed to ${newStatus}`)
				}
			} catch (error) {
				console.error('Failed to change status:', error)
			}
		},
		[]
	)

	const handleDeleteClick = (post) => {
		setPostToDelete(post)
		setShowDeleteModal(true)
	}

	const handleDeleteConfirm = async () => {
		if (!postToDelete) return
		try {
			const res = await fetch(`/api/blog/${postToDelete._id}`, { method: 'DELETE' })
			if (res.ok) {
				loadPosts()
				setShowDeleteModal(false)
				setPostToDelete(null)
				console.log(`Post ${postToDelete._id} deleted successfully`)
			}
		} catch (error) {
			console.error('Failed to delete post:', error)
		}
	}

	const formatDate = (date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		})
	}

	return (
		<ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
		<div className="space-y-6 overflow-x-hidden">
			{/* Header with Create Button */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<h2 className="text-xl md:text-2xl font-bold text-gray-900">Manage Blog Posts</h2>
				<Link
					href="/dashboard/add-blog"
					className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
				>
					+ Create New Post
				</Link>
			</div>

			{/* Filters Section */}
			<div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm overflow-hidden">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
					{/* Search */}
					<div>
						<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Search</label>
						<div className="relative">
							<input
								type="text"
								placeholder="Search posts..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
							/>
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						</div>
					</div>

					{/* Status Filter */}
					<div>
						<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Status</label>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
						>
							<option value="all">All Status</option>
							<option value="published">Published</option>
							<option value="draft">Draft</option>
						</select>
					</div>

					{/* Author Filter */}
					<div>
						<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Author</label>
						<select
							value={authorFilter}
							onChange={(e) => setAuthorFilter(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
						>
							<option value="all">All Authors</option>
							{authors.map((author) => (
								<option key={author.id} value={author.id}>
									{author.name}
								</option>
							))}
						</select>
					</div>

					{/* Sort By */}
					<div>
						<label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Sort By</label>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
						>
							<option value="date-desc">Newest First</option>
							<option value="date-asc">Oldest First</option>
							<option value="title-asc">Title A-Z</option>
							<option value="title-desc">Title Z-A</option>
						</select>
					</div>
				</div>

				{/* Active Filters Display */}
				{(searchQuery || statusFilter !== 'all' || authorFilter !== 'all') && (
					<div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200 flex flex-wrap gap-2">
						<span className="text-xs md:text-sm text-gray-600">Active filters:</span>
						{searchQuery && (
							<span className="inline-flex items-center gap-2 px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
								Search: {searchQuery}
								<button
									onClick={() => setSearchQuery('')}
									className="hover:text-blue-900"
									aria-label="Clear search"
								>
									×
								</button>
							</span>
						)}
						{statusFilter !== 'all' && (
							<span className="inline-flex items-center gap-2 px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
								Status: {statusFilter}
								<button
									onClick={() => setStatusFilter('all')}
									className="hover:text-green-900"
									aria-label="Clear status filter"
								>
									×
								</button>
							</span>
						)}
						{authorFilter !== 'all' && (
							<span className="inline-flex items-center gap-2 px-2 md:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
								Author: {authors.find((a) => a.id === parseInt(authorFilter))?.name}
								<button
									onClick={() => setAuthorFilter('all')}
									className="hover:text-purple-900"
									aria-label="Clear author filter"
								>
									×
								</button>
							</span>
						)}
					</div>
				)}
			</div>

			{/* Results Count */}
			<div className="text-xs md:text-sm text-gray-600">
				Showing <span className="font-medium">{indexOfFirstPost + 1}</span> to{' '}
				<span className="font-medium">{Math.min(indexOfLastPost, filteredPosts.length)}</span> of{' '}
				<span className="font-medium">{filteredPosts.length}</span> posts
			</div>

			{/* Posts Table */}
			<div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
				{loading ? (
					<div className="p-8 text-center text-gray-500"><Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" /></div>
				) : currentPosts.length === 0 ? (
					<div className="p-8 text-center text-gray-500">
						<p className="text-lg font-medium">No posts found</p>
						<p className="text-sm">Try adjusting your filters or create a new post</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50 border-b border-gray-200">
								<tr>
									<th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-900">Title</th>
									<th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-900 hidden sm:table-cell">Author</th>
									<th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-900">Status</th>
									<th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-900 hidden md:table-cell">Date</th>
									<th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs md:text-sm font-semibold text-gray-900 hidden lg:table-cell">Views</th>
									<th className="px-3 md:px-6 py-2 md:py-3 text-right text-xs md:text-sm font-semibold text-gray-900">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-200">
								{currentPosts.map((post) => (
									<tr key={post._id} className="hover:bg-gray-50 transition-colors">
										<td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
											<div>
												<p className="font-medium text-gray-900 line-clamp-2">{post.postTitle}</p>
												<p className="text-xs text-gray-500 truncate hidden sm:block">{post.content?.slice(0, 80) || ''}</p>
											</div>
										</td>
										<td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700 hidden sm:table-cell">{post.author}</td>
										<td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm">
											<div className="flex items-center gap-1 md:gap-2">
												{post.status === 'published' ? (
													<Eye className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
												) : (
													<EyeOff className="w-3 h-3 md:w-4 md:h-4 text-yellow-600" />
												)}
												<span
													className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${
														post.status === 'published'
															? 'bg-green-100 text-green-700'
															: 'bg-yellow-100 text-yellow-700'
													}`}
												>
													{post.status === 'published' ? 'Pub' : 'Draft'}
												</span>
											</div>
										</td>
										<td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700 hidden md:table-cell">{formatDate(post.publishDate)}</td>
										<td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-700 hidden lg:table-cell">{post.views || 0}</td>
										<td className="px-3 md:px-6 py-2 md:py-4 text-right">
											<div className="flex items-center justify-end gap-1 md:gap-2">
												{/* Status Toggle Dropdown */}
												<div className="relative group">
													<button
														title="Change Status"
														className={`p-1 md:p-2 rounded-lg transition-colors ${
															post.status === 'published'
																? 'text-green-600 hover:bg-green-100 bg-green-50'
																: 'text-yellow-600 hover:bg-yellow-100 bg-yellow-50'
														}`}
													>
														{post.status === 'published' ? (
															<Eye className="w-3 h-3 md:w-4 md:h-4" />
														) : (
															<EyeOff className="w-3 h-3 md:w-4 md:h-4" />
														)}
													</button>
													<div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg z-10">
														<button
															onClick={() =>
																handleStatusChange(
																	post._id,
																	post.status === 'published' ? 'draft' : 'published'
																)
															}
															className="block w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm hover:bg-gray-100 whitespace-nowrap first:rounded-t-lg last:rounded-b-lg"
														>
															{post.status === 'published' ? 'Move to Draft' : 'Publish'}
														</button>
													</div>
												</div>
												{/* Edit Button */}
												<button
													onClick={() => handleEdit(post._id)}
													title="Edit Post"
													className="p-1 md:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors bg-blue-50"
												>
													<Edit2 className="w-3 h-3 md:w-4 md:h-4" />
												</button>

												{/* Delete Button */}
												<button
													onClick={() => handleDeleteClick(post)}
													title="Delete Post"
													className="p-1 md:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors bg-red-50"
												>
													<Trash2 className="w-3 h-3 md:w-4 md:h-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pagination */}
			{!loading && filteredPosts.length > postsPerPage && (
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-lg border border-gray-200 p-3 md:p-4 shadow-sm">
					<div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
						Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
					</div>
					<div className="flex gap-2 justify-center sm:justify-end flex-wrap">
						<button
							onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
							disabled={currentPage === 1}
							className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							aria-label="Previous page"
						>
							<ChevronLeft className="w-5 h-5" />
						</button>

						{/* Page numbers */}
						<div className="flex gap-1">
							{Array.from({ length: totalPages }, (_, i) => i + 1)
								.filter(
									(page) =>
										page === 1 ||
										page === totalPages ||
										(page >= currentPage - 1 && page <= currentPage + 1)
								)
								.map((page, index, arr) => (
									<React.Fragment key={page}>
										{index > 0 && arr[index - 1] !== page - 1 && (
											<span className="px-2 py-2 text-gray-500">...</span>
										)}
										<button
											onClick={() => setCurrentPage(page)}
											className={`px-3 py-2 text-sm rounded-lg transition-colors ${
												currentPage === page
													? 'bg-indigo-600 text-white'
													: 'border border-gray-300 hover:bg-gray-50'
											}`}
										>
											{page}
										</button>
									</React.Fragment>
								))}
						</div>

						<button
							onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
							disabled={currentPage === totalPages}
							className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							aria-label="Next page"
						>
							<ChevronRight className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-4 md:p-6">
						<h3 className="text-lg font-bold text-gray-900 mb-2">Delete Post?</h3>
						<p className="text-sm md:text-base text-gray-600 mb-6">
							Are you sure you want to delete &#34;<span className="font-medium">{postToDelete?.title}</span>&#34;? This action
							cannot be undone.
						</p>
						<div className="flex gap-3 justify-end">
							<button
								onClick={() => setShowDeleteModal(false)}
								className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
							>
								Cancel
							</button>
							<button
								onClick={handleDeleteConfirm}
								className="px-3 md:px-4 py-2 text-sm md:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
		</ProtectedRoute>
	)
}

export default ManageBlogPage
