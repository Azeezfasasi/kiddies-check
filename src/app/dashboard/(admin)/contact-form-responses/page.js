'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Trash2, Eye, Reply, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
// import { useAuth } from '../../../context/AuthContext';
import { Commet } from "react-loading-indicators";
import { ProtectedRoute } from '@/components/ProtectedRoute';

const ContactFormResponses = () => {
		useEffect(() => {
			loadResponses();
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		async function loadResponses() {
			setLoading(true);
			try {
				const res = await fetch('/api/contact');
				const data = await res.json();
				if (data.success && Array.isArray(data.contacts)) {
					setResponses(data.contacts);
					applyFilters(data.contacts, searchQuery, statusFilter);
				} else {
					setResponses([]);
					applyFilters([], searchQuery, statusFilter);
				}
			} catch (error) {
				setResponses([]);
				applyFilters([], searchQuery, statusFilter);
			} finally {
				setLoading(false);
			}
		}
	const [responses, setResponses] = useState([])
	const [filteredResponses, setFilteredResponses] = useState([])
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all') // all, pending, replied, closed
	const [showViewModal, setShowViewModal] = useState(false)
	const [showReplyModal, setShowReplyModal] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [showStatusModal, setShowStatusModal] = useState(false)
	const [selectedResponse, setSelectedResponse] = useState(null)
	const [replyText, setReplyText] = useState('')
	const [replyEmail, setReplyEmail] = useState('')
	const [newStatus, setNewStatus] = useState('')
	const responsesPerPage = 10;
	// If you use AuthContext, import and use it here:
	// import { useAuth } from '../../../context/AuthContext';
	// const { user } = useAuth();
	// For now, set user to null to avoid errors if not using AuthContext
	// const user = null;
	// You must define loadResponses and useEffect for fetching data
	// Add your loadResponses and useEffect here if not present
	const applyFilters = useCallback((data, search, status) => {
		let filtered = data

		// Search filter
		if (search.trim()) {
			filtered = filtered.filter(
				(response) =>
					response.name.toLowerCase().includes(search.toLowerCase()) ||
					response.email.toLowerCase().includes(search.toLowerCase()) ||
					response.subject.toLowerCase().includes(search.toLowerCase()) ||
					response.message.toLowerCase().includes(search.toLowerCase())
			)
		}

		// Status filter
		if (status !== 'all') {
			filtered = filtered.filter((response) => response.status === status)
		}

		// Sort by date (newest first)
		filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

		setFilteredResponses(filtered)
		setCurrentPage(1)
	}, [])

	// Handle search
	const handleSearch = (e) => {
		const query = e.target.value
		setSearchQuery(query)
		applyFilters(responses, query, statusFilter)
	}

	// Handle status filter
	const handleStatusFilter = (status) => {
		setStatusFilter(status)
		applyFilters(responses, searchQuery, status)
	}

	// Clear filters
	const clearFilters = () => {
		setSearchQuery('')
		setStatusFilter('all')
		setCurrentPage(1)
		setFilteredResponses(responses)
	}

	// View response
	const handleView = (response) => {
		setSelectedResponse(response)
		setShowViewModal(true)
	}


	// Reply to response
	const handleReplyClick = (response) => {
		setSelectedResponse(response)
		setReplyEmail(response.email)
		setReplyText('')
		setShowReplyModal(true)
	}

	// Submit reply
	const handleSubmitReply = async () => {
		if (!replyText.trim()) {
			alert('Please enter a reply message')
			return
		}
		if (!user || !user._id) {
			alert("You must be logged in as an admin or learning-specialist to reply.")
			return
		}
		try {
			console.log('Replying to contact ID:', selectedResponse?._id);
			const res = await fetch(`/api/contact/${selectedResponse._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message: replyText, senderId: user._id }),
			})
			const data = await res.json()
			if (data.success) {
				loadResponses()
				setShowReplyModal(false)
				alert('Reply sent successfully!')
			} else {
				alert(data.message || 'Failed to send reply')
			}
		} catch (error) {
			console.error('Failed to send reply:', error)
			alert('Failed to send reply')
		}
	}

	// Delete response
	const handleDelete = async () => {
		try {
			const res = await fetch(`/api/contact/${selectedResponse._id}`, { method: 'DELETE' })
			const data = await res.json()
			if (data.success) {
				loadResponses()
				setShowDeleteModal(false)
				alert('Response deleted successfully!')
			} else {
				alert(data.message || 'Failed to delete response')
			}
		} catch (error) {
			console.error('Failed to delete response:', error)
			alert('Failed to delete response')
		}
	}

	// Change status
	const handleChangeStatus = async (response, newStatus) => {
		if (!user || !user._id) {
			alert("You must be logged in as an admin or learning-specialist to change status.")
			return
		}
		try {
			console.log('Changing status for contact ID:', response?._id);
			const res = await fetch(`/api/contact/${response._id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus, senderId: user._id }),
			})
			const data = await res.json()
			if (data.success) {
				loadResponses()
				alert('Status updated successfully!')
			} else {
				alert(data.message || 'Failed to update status')
			}
		} catch (error) {
			console.error('Failed to update status:', error)
			alert('Failed to update status')
		}
	}

	// Pagination
	const totalPages = Math.ceil(filteredResponses.length / responsesPerPage)
	const startIndex = (currentPage - 1) * responsesPerPage
	const endIndex = startIndex + responsesPerPage
	const currentResponses = filteredResponses.slice(startIndex, endIndex)

	// Get status badge color
	const getStatusColor = (status) => {
		switch (status) {
			case 'pending':
				return 'bg-blue-100 text-blue-800'
			case 'replied':
				return 'bg-green-100 text-green-800'
			case 'closed':
				return 'bg-gray-100 text-gray-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	// Format date
	const formatDate = (date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	if (loading) {
		return (
			<div className="flex justify-center items-center py-12">
				<p className="text-gray-600"><Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" /></p>
			</div>
		)
	}

	return (
		<ProtectedRoute allowedRoles={['admin', 'learning-specialist']}>
		<div className="bg-gray-50 py-4 md:py-8 px-0 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto overflow-x-hidden">
				<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Contact Form Responses</h1>
				{/* Search and Filters */}
				<div className="w-full bg-white rounded-lg shadow-sm p-2 md:p-6 mb-6">
					<div className="flex flex-col gap-4">
						{/* Search Bar */}
						<div className="relative">
							<Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Search by name, email, subject, or message..."
								value={searchQuery}
								onChange={handleSearch}
								className="w-full pl-10 pr-2 md:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-[14px] md:text-[16px] focus:border-transparent outline-none"
							/>
						</div>

						{/* Filters and Clear Button */}
						<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
							<div className="flex flex-wrap gap-2">
									<button
										onClick={() => handleStatusFilter('all')}
										className={`px-4 py-2 text-[14px] md:text-[16px] rounded-lg font-medium transition ${
											statusFilter === 'all'
												? 'bg-orange-600 text-white'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
										}`}
									>
										All ({responses.length})
									</button>
									<button
										onClick={() => handleStatusFilter('pending')}
										className={`px-4 py-2 text-[14px] md:text-[16px] rounded-lg font-medium transition ${
											statusFilter === 'pending'
												? 'bg-blue-600 text-white'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
										}`}
									>
										Pending ({responses.filter((r) => r.status === 'pending').length})
									</button>
									<button
										onClick={() => handleStatusFilter('replied')}
										className={`px-4 py-2 text-[14px] md:text-[16px] rounded-lg font-medium transition ${
											statusFilter === 'replied'
												? 'bg-green-600 text-white'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
										}`}
									>
										Replied ({responses.filter((r) => r.status === 'replied').length})
									</button>
									<button
										onClick={() => handleStatusFilter('closed')}
										className={`px-4 py-2 text-[14px] md:text-[16px] rounded-lg font-medium transition ${
											statusFilter === 'closed'
												? 'bg-gray-600 text-white'
												: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
										}`}
									>
										Closed ({responses.filter((r) => r.status === 'closed').length})
									</button>
							</div>

							{(searchQuery || statusFilter !== 'all') && (
								<button
									onClick={clearFilters}
									className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition"
								>
									Clear Filters
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Results Summary */}
				<div className="mb-4 text-sm text-gray-600">
					Showing {currentResponses.length > 0 ? startIndex + 1 : 0} to{' '}
					{Math.min(endIndex, filteredResponses.length)} of {filteredResponses.length} responses
				</div>

				{/* Responses Table */}
				{filteredResponses.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-12 text-center">
						<Filter className="mx-auto w-12 h-12 text-gray-400 mb-4" />
						<p className="text-gray-600 text-lg font-medium">No responses found</p>
						<p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
					</div>
				) : (
					<div className="w-full bg-gray-50 rounded-lg shadow-sm overflow-hidden">
						<div className="w-[320px] md:w-full overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-100 border-b border-gray-200">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
											Name & Email
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
											Subject
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
											Date
										</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200">
									{currentResponses.map((response) => (
										<tr key={response._id} className="hover:bg-gray-50 transition">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="font-medium text-gray-900">{response.name}</div>
												<div className="text-sm text-gray-500">{response.email}</div>
											</td>
											<td className="px-6 py-4">
												<div className="text-sm text-gray-900 font-medium truncate max-w-xs">
													{response.subject}
												</div>
												<div className="text-xs text-gray-500 truncate max-w-xs">{response.message}</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(response.status)}`}>
													{response.status === 'new' ? '🔵 New' : response.status === 'replied' ? '✓ Replied' : '📦 Archived'}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
												{formatDate(response.createdAt)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center justify-center gap-2">
													<button
														onClick={() => handleView(response)}
														className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
														title="View"
													>
														<Eye className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleReplyClick(response)}
														className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
														title="Reply"
													>
														<Reply className="w-4 h-4" />
													</button>
													<button
														onClick={() => setShowStatusModal(true) || setSelectedResponse(response)}
														className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
														title="Change Status"
													>
														<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
															<path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 0 1 2.647 2.647l-2.25 9a2.25 2.25 0 0 1-1.615 1.615l-9 2.25a2.25 2.25 0 0 1-2.647-2.647l2.25-9a2.25 2.25 0 0 1 1.615-1.615l9-2.25z" />
														</svg>
													</button>
																	{/* Status Change Modal */}
																	{showStatusModal && selectedResponse && (
																		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
																			<div className="bg-white rounded-lg shadow-lg max-w-md w-full">
																				<div className="p-6 border-b border-gray-200 flex justify-between items-center">
																					<h3 className="text-lg font-semibold text-gray-900">Change Response Status</h3>
																					<button
																						onClick={() => setShowStatusModal(false)}
																						className="text-gray-500 hover:text-gray-700"
																					>
																						<X className="w-6 h-6" />
																					</button>
																				</div>

																				<div className="p-6 space-y-4">
																					<div>
																						<label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
																						<span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedResponse.status)}`}>
																							{selectedResponse.status}
																						</span>
																					</div>
																					<div>
																						<label className="block text-sm font-medium text-gray-700 mb-2">New Status *</label>
																						<select
																							value={newStatus}
																							onChange={(e) => setNewStatus(e.target.value)}
																							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
																						>
																							<option value="">Select a status</option>
																							<option value="pending">Pending</option>
																							<option value="replied">Replied</option>
																							<option value="closed">Closed</option>
																						</select>
																					</div>
																				</div>

																				<div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
																					<button
																						onClick={() => setShowStatusModal(false)}
																						className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
																					>
																						Cancel
																					</button>
																					<button
																						onClick={async () => {
																							if (!newStatus) {
																								alert('Please select a status');
																								return;
																							}
																							await handleChangeStatus(selectedResponse, newStatus);
																							setShowStatusModal(false);
																						}}
																						className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition flex items-center gap-2"
																					>
																						Update Status
																					</button>
																				</div>
																			</div>
																		</div>
																	)}
													<button
														onClick={() => {
															setSelectedResponse(response)
															setShowDeleteModal(true)
														}}
														className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
														title="Delete"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
								<p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
								<div className="flex gap-2">
									<button
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
									>
										<ChevronLeft className="w-5 h-5" />
									</button>
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
										<button
											key={page}
											onClick={() => setCurrentPage(page)}
											className={`px-3 py-1 rounded-lg font-medium transition ${
												currentPage === page
													? 'bg-orange-600 text-white'
													: 'border border-gray-300 text-gray-700 hover:bg-gray-100'
											}`}
										>
											{page}
										</button>
									))}
									<button
										onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
										disabled={currentPage === totalPages}
										className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
									>
										<ChevronRight className="w-5 h-5" />
									</button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* View Modal */}
				{showViewModal && selectedResponse && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
							<div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
								<h3 className="text-lg font-semibold text-gray-900">View Response</h3>
								<button
									onClick={() => setShowViewModal(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									<X className="w-6 h-6" />
								</button>
							</div>

							<div className="p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
									<p className="text-gray-900">{selectedResponse.name}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
									<p className="text-gray-900">{selectedResponse.email}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
									<p className="text-gray-900">{selectedResponse.subject}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
									<p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
										{selectedResponse.message}
									</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Submitted On</label>
									<p className="text-gray-900">{formatDate(selectedResponse.createdAt)}</p>
								</div>

								{selectedResponse.replied && (
									<div className="bg-green-50 border border-green-200 rounded-lg p-4">
										<p className="text-sm text-green-800">
											<strong>✓ Reply sent on:</strong> {formatDate(selectedResponse.replyDate)}
										</p>
									</div>
								)}
							</div>

							<div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-gray-50">
								<button
									onClick={() => setShowViewModal(false)}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
								>
									Close
								</button>
								<button
									onClick={() => {
										setShowViewModal(false)
										handleReplyClick(selectedResponse)
									}}
									className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center gap-2"
								>
									<Reply className="w-4 h-4" />
									Reply
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Reply Modal */}
				{showReplyModal && selectedResponse && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
							<div className="p-6 border-b border-gray-200 flex justify-between items-center">
								<h3 className="text-lg font-semibold text-gray-900">Reply to Message</h3>
								<button
									onClick={() => setShowReplyModal(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									<X className="w-6 h-6" />
								</button>
							</div>

							<div className="p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">From</label>
									<p className="text-gray-900">info@kiddiescheck.org</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">To</label>
									<p className="text-gray-900">{replyEmail}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Original Subject</label>
									<p className="text-gray-900">Re: {selectedResponse.subject}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Reply Message *</label>
									<textarea
										value={replyText}
										onChange={(e) => setReplyText(e.target.value)}
										rows="6"
										placeholder="Type your reply message here..."
										className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
									/>
									<p className="text-xs text-gray-500 mt-1">{replyText.length} characters</p>
								</div>
							</div>

							<div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
								<button
									onClick={() => setShowReplyModal(false)}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
								>
									Cancel
								</button>
								<button
									onClick={handleSubmitReply}
									className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center gap-2"
								>
									<Reply className="w-4 h-4" />
									Send Reply
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Delete Modal */}
				{showDeleteModal && selectedResponse && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-md w-full">
							<div className="p-6">
								<div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
									<Trash2 className="w-6 h-6 text-red-600" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Response</h3>
								<p className="text-gray-600 text-center mb-6">
									Are you sure you want to delete this response from{' '}
									<strong>{selectedResponse.name}</strong>? This action cannot be undone.
								</p>
							</div>

							<div className="p-6 border-t border-gray-200 flex justify-center gap-3 bg-gray-50">
								<button
									onClick={() => setShowDeleteModal(false)}
									className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
								>
									Cancel
								</button>
								<button
									onClick={handleDelete}
									className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
								>
									Delete
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
		</ProtectedRoute>
	)
}

export default ContactFormResponses
