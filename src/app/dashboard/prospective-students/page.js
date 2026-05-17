
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader,
  Users,
  Check,
  X,
  Eye,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  User as UserIcon,
  TrendingUp,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProspectiveStudentsPage() {
  const router = useRouter();
  const [prospectiveStudents, setPerspectiveStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [actingOnStudent, setActingOnStudent] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null); // 'approve' or 'reject'
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !schoolId || !userId) {
      router.push("/login");
      return;
    }

    setActiveSchoolId(schoolId);
    setUserId(userId);
    fetchData(schoolId, userId);
  }, [router]);

  const fetchData = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/prospective-students?schoolId=${schoolId}&search=${encodeURIComponent(searchQuery)}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prospective students");
      }

      const data = await response.json();
      setPerspectiveStudents(data.prospectiveStudents);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load prospective students");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!actingOnStudent) return;

    setProcessingId(actingOnStudent._id);
    try {
      const response = await fetch("/api/prospective-students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          prospectiveStudentId: actingOnStudent._id,
          action: "approve",
          notes: approvalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve student");
      }

      toast.success("Student approved successfully!");
      setShowApprovalModal(false);
      setApprovalNotes("");
      setActingOnStudent(null);
      setApprovalAction(null);
      fetchData(activeSchoolId, userId);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!actingOnStudent) return;

    setProcessingId(actingOnStudent._id);
    try {
      const response = await fetch("/api/prospective-students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          prospectiveStudentId: actingOnStudent._id,
          action: "reject",
          rejectionReason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject student");
      }

      toast.success("Student rejected");
      setShowApprovalModal(false);
      setRejectionReason("");
      setActingOnStudent(null);
      setApprovalAction(null);
      fetchData(activeSchoolId, userId);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedStatus("pending");
  };

  const filteredStudents = prospectiveStudents.filter(
    (student) => student.status === selectedStatus
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading prospective students...</p>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "approved":
        return <Check className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">
              Prospective Students
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Review and approve student registrations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
              </div>
              <Check className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
              </div>
              <X className="w-10 h-10 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or parent name..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedStatus("pending")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Pending ({stats.pending})
              </button>
              <button
                onClick={() => setSelectedStatus("approved")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === "approved"
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setSelectedStatus("rejected")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Rejected ({stats.rejected})
              </button>
            </div>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No {selectedStatus} students
            </h2>
            <p className="text-gray-600">
              {searchQuery
                ? "No results match your search"
                : `There are no ${selectedStatus} prospective students at this time`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {student.firstName} {student.lastName}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(
                              student.status
                            )}`}
                          >
                            {getStatusIcon(student.status)}
                            {student.status.charAt(0).toUpperCase() +
                              student.status.slice(1)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 mt-2">
                          {student.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{student.email}</span>
                            </div>
                          )}
                          {student.dateOfBirth && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(student.dateOfBirth).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {student.parentName && (
                            <div className="flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              <span className="truncate">{student.parentName}</span>
                            </div>
                          )}
                          {student.classId && (
                            <div className="flex items-center gap-1">
                              <span className="truncate">{student.classId.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:flex-col">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </button>

                    {student.status === "pending" && (
                      <>
                        <button
                          onClick={() => {
                            setActingOnStudent(student);
                            setApprovalAction("approve");
                            setShowApprovalModal(true);
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Check className="w-4 h-4" />
                          <span className="hidden sm:inline">Approve</span>
                        </button>
                        <button
                          onClick={() => {
                            setActingOnStudent(student);
                            setApprovalAction("reject");
                            setShowApprovalModal(true);
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <X className="w-4 h-4" />
                          <span className="hidden sm:inline">Reject</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Student Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Student Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">First Name</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Name</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="text-gray-900 font-medium">
                      {selectedStudent.dateOfBirth
                        ? new Date(selectedStudent.dateOfBirth).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="text-gray-900 font-medium capitalize">
                      {selectedStudent.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.phone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Class Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Class Assignment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="text-gray-900 font-medium">
                      {selectedStudent.classId?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">School Type</p>
                    <p className="text-gray-900 font-medium capitalize">
                      {selectedStudent.schoolType === "my-childs-school"
                        ? "My Child's School"
                        : selectedStudent.schoolType === "home-school"
                        ? "Home School"
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Info */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Parent Name</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.parentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parent Email</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.parentEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Parent Phone</p>
                    <p className="text-gray-900 font-medium">{selectedStudent.parentPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedStudent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Info */}
              {(selectedStudent.status === "approved" || selectedStudent.status === "rejected") && (
                <div className="border-t pt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {selectedStudent.status === "approved" ? "Approval" : "Rejection"} Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedStudent.status === "approved" ? "Approved" : "Rejected"} By
                      </p>
                      <p className="text-gray-900 font-medium">
                        {selectedStudent.approvedBy?.firstName} {selectedStudent.approvedBy?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedStudent.status === "approved" ? "Approved" : "Rejected"} Date
                      </p>
                      <p className="text-gray-900 font-medium">
                        {new Date(
                          selectedStudent.approvedAt || selectedStudent.rejectedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedStudent.approvalNotes && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="text-gray-900 font-medium">{selectedStudent.approvalNotes}</p>
                      </div>
                    )}
                    {selectedStudent.rejectionReason && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Rejection Reason</p>
                        <p className="text-gray-900 font-medium">
                          {selectedStudent.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {showApprovalModal && actingOnStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div
              className={`${
                approvalAction === "approve"
                  ? "bg-gradient-to-r from-green-600 to-green-700"
                  : "bg-gradient-to-r from-red-600 to-red-700"
              } px-6 py-4 flex justify-between items-center`}
            >
              <h2 className="text-xl font-bold text-white">
                {approvalAction === "approve" ? "Approve Student" : "Reject Student"}
              </h2>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalNotes("");
                  setRejectionReason("");
                  setActingOnStudent(null);
                  setApprovalAction(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-700">
                  Are you sure you want to {approvalAction}{" "}
                  <span className="font-semibold">
                    {actingOnStudent.firstName} {actingOnStudent.lastName}
                  </span>
                  ?
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {approvalAction === "approve" ? "Approval Notes (Optional)" : "Rejection Reason"}
                </label>
                <textarea
                  value={approvalAction === "approve" ? approvalNotes : rejectionReason}
                  onChange={(e) => {
                    if (approvalAction === "approve") {
                      setApprovalNotes(e.target.value);
                    } else {
                      setRejectionReason(e.target.value);
                    }
                  }}
                  placeholder={
                    approvalAction === "approve"
                      ? "Add any notes about this approval (optional)"
                      : "Explain why this student is being rejected"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    setApprovalNotes("");
                    setRejectionReason("");
                    setActingOnStudent(null);
                    setApprovalAction(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={approvalAction === "approve" ? handleApprove : handleReject}
                  disabled={processingId === actingOnStudent._id}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                    approvalAction === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {processingId === actingOnStudent._id ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {approvalAction === "approve" ? (
                        <>
                          <Check className="w-4 h-4" />
                          Approve
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4" />
                          Reject
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
