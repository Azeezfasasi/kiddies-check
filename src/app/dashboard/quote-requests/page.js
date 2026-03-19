'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { Trash2, Eye, Reply, Search, Filter, ChevronLeft, ChevronRight, X, CheckCircle } from 'lucide-react'
import { Commet } from "react-loading-indicators";

const ManageQuoteRequests = () => {
				const { user } = useAuth();
			// Handle submit reply
			const handleSubmitReply = async () => {
				if (!replyText.trim()) {
					alert('Please enter a response or quote.');
					return;
				}
				try {
					if (!user || !user._id) {
						alert('You must be logged in as an admin or learning-specialist to reply.');
						return;
					}
					const res = await fetch(`/api/quote/${selectedRequest._id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ message: replyText, senderId: user._id }),
					});
					const data = await res.json();
					if (data.success) {
						setShowReplyModal(false);
						setReplyText("");
						setReplyEmail("");
						alert('Reply sent successfully!');
						loadRequests();
					} else {
						alert(data.message || 'Failed to send reply.');
					}
				} catch (error) {
					console.error('Failed to send reply:', error);
					alert('Failed to send reply.');
				}
			};
		// Handle view action
		const handleView = (request) => {
			setSelectedRequest(request);
			setShowViewModal(true);
		};

		// Handle reply action
		const handleReplyClick = (request) => {
			setSelectedRequest(request);
			setReplyEmail(request.email);
			setReplyText("");
			setShowReplyModal(true);
		};
	// Handle search
	const handleSearch = (e) => {
		const value = e.target.value;
		setSearchQuery(value);
		setFilteredRequests(applyFilters(requests, value, statusFilter));
		setCurrentPage(1);
	};

	// Handle status filter
	const handleStatusFilter = (status) => {
		setStatusFilter(status);
		setFilteredRequests(applyFilters(requests, searchQuery, status));
		setCurrentPage(1);
	};

	// Clear all filters
	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("all");
		setFilteredRequests(applyFilters(requests, "", "all"));
		setCurrentPage(1);
	};
	const [requests, setRequests] = useState([])
	const [filteredRequests, setFilteredRequests] = useState([])
	const [loading, setLoading] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all') // all, pending, in-progress, completed, replied, closed
	const [showViewModal, setShowViewModal] = useState(false)
	const [showReplyModal, setShowReplyModal] = useState(false)
	const [showStatusModal, setShowStatusModal] = useState(false)
	const [showDeleteModal, setShowDeleteModal] = useState(false)
	const [selectedRequest, setSelectedRequest] = useState(null)
	const [replyText, setReplyText] = useState('')
	const [replyEmail, setReplyEmail] = useState('')
	const [newStatus, setNewStatus] = useState('')

	const requestsPerPage = 10

	// Load requests from backend API
	useEffect(() => {
		loadRequests()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const loadRequests = async () => {
		setLoading(true)
		try {
			const res = await fetch('/api/quote')
			const data = await res.json()
			if (data.success) {
				setRequests(data.quotes)
				setFilteredRequests(applyFilters(data.quotes, '', 'all'));
				setSearchQuery('');
				setStatusFilter('all');
				setCurrentPage(1);
			} else {
				setRequests([])
				setFilteredRequests([]);
				setSearchQuery('');
				setStatusFilter('all');
				setCurrentPage(1);
			}
		} catch (error) {
			console.error('Failed to load requests:', error)
			setRequests([])
			setFilteredRequests([]);
			setSearchQuery('');
			setStatusFilter('all');
			setCurrentPage(1);
		} finally {
			setLoading(false)
		}
	}

	const applyFilters = useCallback((data, search, status) => {
		let filtered = data

		// Search filter
		if (search.trim()) {
			filtered = filtered.filter(
				(request) =>
					request.name.toLowerCase().includes(search.toLowerCase()) ||
					request.email.toLowerCase().includes(search.toLowerCase()) ||
					request.company.toLowerCase().includes(search.toLowerCase()) ||
					request.service.toLowerCase().includes(search.toLowerCase()) ||
					request.message.toLowerCase().includes(search.toLowerCase())
			)
		}

		// Status filter
		if (status !== 'all') {
			filtered = filtered.filter((request) => request.status === status)
		}

		// Sort by date (newest first)
		filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		return filtered;
	}, []);

	// Change status
	const handleChangeStatus = async () => {
		if (!newStatus) {
			alert('Please select a status');
			return;
		}
		if (!user || !user._id) {
			alert('You must be logged in as an admin or learning-specialist to change status.');
			return;
		}
		try {
			const res = await fetch(`/api/quote/${selectedRequest._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus, senderId: user._id }),
			});
			const data = await res.json();
			if (data.success) {
				loadRequests();
				setShowStatusModal(false);
				alert("Status updated successfully!");
			} else {
				alert(data.message || "Failed to update status");
			}
		} catch (error) {
			console.error("Failed to update status:", error);
			alert("Failed to update status");
		}
	};

	// Delete request
	const handleDelete = async () => {
		try {
			const res = await fetch(`/api/quote/${selectedRequest._id}`, {
				method: "DELETE",
			});
			const data = await res.json();
			if (data.success) {
				loadRequests();
				setShowDeleteModal(false);
				alert("Quote request deleted.");
			} else {
				alert(data.message || "Failed to delete request");
			}
		} catch (error) {
			console.error("Failed to delete request:", error);
			alert("Failed to delete request");
		}
	};

	// Pagination
	const totalPages = Math.ceil(filteredRequests.length / requestsPerPage)
	const startIndex = (currentPage - 1) * requestsPerPage
	const endIndex = startIndex + requestsPerPage
	const currentRequests = filteredRequests.slice(startIndex, endIndex)

	// Get status badge color
	const getStatusColor = (status) => {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800'
			case 'in-progress':
				return 'bg-blue-100 text-blue-800'
			case 'completed':
				return 'bg-green-100 text-green-800'
			case 'replied':
				return 'bg-purple-100 text-purple-800'
			case 'closed':
				return 'bg-red-100 text-red-800'
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
		<div className="bg-gray-50 py-2 md:py-8 px-0 sm:px-6 lg:px-8 mx-auto">
			<div className="w-[330px] md:w-full md:max-w-7xl mx-auto">
				<h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Quote Requests</h1>
				{/* Search and Filters */}
				<div className="bg-white rounded-lg shadow-sm p-2 md:p-6 mb-6">
					<div className="flex flex-col gap-4">
						{/* Search Bar */}
						<div className="relative">
							<Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
							<input
								type="text"
								placeholder="Search by name, email, company, service, or message..."
								value={searchQuery}
								onChange={handleSearch}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
							/>
						</div>

						{/* Filters and Clear Button */}
						<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => handleStatusFilter('all')}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										statusFilter === 'all'
											? 'bg-orange-600 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									All ({requests.length})
								</button>
								<button
									onClick={() => handleStatusFilter('pending')}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										statusFilter === 'pending'
											? 'bg-yellow-600 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Pending ({requests.filter((r) => r.status === 'pending').length})
								</button>
								<button
									onClick={() => handleStatusFilter('in-progress')}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										statusFilter === 'in-progress'
											? 'bg-blue-600 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									In-Progress ({requests.filter((r) => r.status === 'in-progress').length})
								</button>
								<button
									onClick={() => handleStatusFilter('completed')}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										statusFilter === 'completed'
											? 'bg-green-600 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Completed ({requests.filter((r) => r.status === 'completed').length})
								</button>
								<button
									onClick={() => handleStatusFilter('replied')}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										statusFilter === 'replied'
											? 'bg-purple-600 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Replied ({requests.filter((r) => r.status === 'replied').length})
								</button>
								<button
									onClick={() => handleStatusFilter('closed')}
									className={`px-4 py-2 rounded-lg font-medium transition ${
										statusFilter === 'closed'
											? 'bg-red-600 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
									}`}
								>
									Closed ({requests.filter((r) => r.status === 'closed').length})
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
					Showing {currentRequests.length > 0 ? startIndex + 1 : 0} to{' '}
					{Math.min(endIndex, filteredRequests.length)} of {filteredRequests.length} requests
				</div>

				{/* Requests Table */}
				{filteredRequests.length === 0 ? (
					<div className="bg-white rounded-lg shadow-sm p-12 text-center">
						<Filter className="mx-auto w-12 h-12 text-gray-400 mb-4" />
						<p className="text-gray-600 text-lg font-medium">No requests found</p>
						<p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
					</div>
				) : (
					<div className="bg-white rounded-lg shadow-sm overflow-hidden">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead className="bg-gray-50 border-b border-gray-200">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
											Name & Company
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
											Service
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
									{currentRequests.map((request, idx) => (
										<tr key={request._id || request.id || idx} className="hover:bg-gray-50 transition">
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="font-medium text-gray-900">{request.name}</div>
												<div className="text-sm text-gray-500">{request.company}</div>
											</td>
											<td className="px-6 py-4">
												<span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
													{request.service}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
													{request.status === 'pending' && '⏳ Pending'}
													{request.status === 'quoted' && '💬 Quoted'}
													{request.status === 'completed' && '✓ Completed'}
													{request.status === 'rejected' && '✗ Rejected'}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
												{formatDate(request.createdAt)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="flex items-center justify-center gap-2">
													<button
														onClick={() => handleView(request)}
														className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
														title="View"
													>
														<Eye className="w-4 h-4" />
													</button>
													<button
														onClick={() => handleReplyClick(request)}
														className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
														title="Reply"
													>
														<Reply className="w-4 h-4" />
													</button>
													<button
														onClick={() => {
															setSelectedRequest(request)
															setNewStatus(request.status)
															setShowStatusModal(true)
														}}
														className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
														title="Change Status"
													>
														<CheckCircle className="w-4 h-4" />
													</button>
													<button
														onClick={() => {
															setSelectedRequest(request)
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
				{showViewModal && selectedRequest && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
							<div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
								<h3 className="text-lg font-semibold text-gray-900">View Quote Request</h3>
								<button
									onClick={() => setShowViewModal(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									<X className="w-6 h-6" />
								</button>
							</div>

							<div className="p-6 space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
										<p className="text-gray-900">{selectedRequest.name}</p>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
										<p className="text-gray-900">{selectedRequest.company}</p>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
										<p className="text-gray-900">{selectedRequest.email}</p>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
										<p className="text-gray-900">{selectedRequest.phone}</p>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
									<p className="text-gray-900">{selectedRequest.service}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">Project Details</label>
									<p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
										{selectedRequest.message}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
										<span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}>
											{selectedRequest.status === 'pending' && '⏳ Pending'}
											{selectedRequest.status === 'quoted' && '💬 Quoted'}
											{selectedRequest.status === 'completed' && '✓ Completed'}
											{selectedRequest.status === 'rejected' && '✗ Rejected'}
										</span>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-1">Submitted On</label>
										<p className="text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
									</div>
								</div>
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
										handleReplyClick(selectedRequest)
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
				{showReplyModal && selectedRequest && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
							<div className="p-6 border-b border-gray-200 flex justify-between items-center">
								<h3 className="text-lg font-semibold text-gray-900">Reply to Quote Request</h3>
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
									<p className="text-gray-900">admin@kiddiescheck.org</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">To</label>
									<p className="text-gray-900">{replyEmail}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Original Request</label>
									<p className="text-gray-900 text-sm bg-gray-50 p-3 rounded">Service: {selectedRequest.service}</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Your Response/Quote *</label>
									<textarea
										value={replyText}
										onChange={(e) => setReplyText(e.target.value)}
										rows="6"
										placeholder="Type your quote or response here. Include pricing, timeline, scope of work, etc."
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
									Send Quote
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Status Change Modal */}
				{showStatusModal && selectedRequest && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-md w-full">
							<div className="p-6 border-b border-gray-200 flex justify-between items-center">
								<h3 className="text-lg font-semibold text-gray-900">Change Request Status</h3>
								<button
									onClick={() => setShowStatusModal(false)}
									className="text-gray-500 hover:text-gray-700"
								>
									<X className="w-6 h-6" />
								</button>
							</div>

							<div className="p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Request From</label>
									<p className="text-gray-900">{selectedRequest.name} ({selectedRequest.company})</p>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
									<span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRequest.status)}`}>
										{selectedRequest.status === 'pending' && '⏳ Pending'}
										{selectedRequest.status === 'quoted' && '💬 Quoted'}
										{selectedRequest.status === 'completed' && '✓ Completed'}
										{selectedRequest.status === 'rejected' && '✗ Rejected'}
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
										<option value="in-progress">In-Progress</option>
										<option value="completed">Completed</option>
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
									onClick={handleChangeStatus}
									className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition flex items-center gap-2"
								>
									<CheckCircle className="w-4 h-4" />
									Update Status
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Delete Modal */}
				{showDeleteModal && selectedRequest && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-lg shadow-lg max-w-md w-full">
							<div className="p-6">
								<div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
									<Trash2 className="w-6 h-6 text-red-600" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Quote Request</h3>
								<p className="text-gray-600 text-center mb-6">
									Are you sure you want to delete this quote request from{' '}
									<strong>{selectedRequest.name}</strong>? This action cannot be undone.
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
	)
}

export default ManageQuoteRequests
