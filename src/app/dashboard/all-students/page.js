"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, AlertCircle, Loader, Users, Eye, UserPlus, MessageSquare, QrCode, CreditCard, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import toast from "react-hot-toast";
import StudentModal from "@/app/components/StudentModal";
import StudentDetailsModal from "@/app/components/StudentDetailsModal";
import ParentAssignmentModal from "@/app/components/ParentAssignmentModal";
import ParentProfileModal from "@/app/components/ParentProfileModal";
import StudentFeedbackPanel from "@/app/components/StudentFeedbackPanel";
import QRCodeDisplay from "@/app/components/QRCodeDisplay";
import AccessCard from "@/app/components/AccessCard";
import NotebookUploadModal from "@/app/components/NotebookUploadModal";

export default function AllStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedClass, setSelectedClass] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showParentAssignmentModal, setShowParentAssignmentModal] = useState(false);
  const [studentForParentAssignment, setStudentForParentAssignment] = useState(null);
  const [showParentProfileModal, setShowParentProfileModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [selectedStudentForFeedback, setSelectedStudentForFeedback] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudentForQR, setSelectedStudentForQR] = useState(null);
  const [showAccessCardModal, setShowAccessCardModal] = useState(false);
  const [selectedStudentForAccessCard, setSelectedStudentForAccessCard] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [selectedStudentForNotebook, setSelectedStudentForNotebook] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Try activeSchoolId first (for admins who switched schools), fall back to schoolId
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const schoolName = localStorage.getItem("schoolName") || "School Name";

    if (!token || !schoolId || !userId) {
      router.push("/login");
      return;
    }

    setActiveSchoolId(schoolId);
    setUserId(userId);
    setSchoolName(schoolName);
    fetchData(schoolId, userId);
  }, [router]);

  const fetchData = async (schoolId, userId) => {
    try {
      setLoading(true);
      
      // Fetch classes
      const classRes = await fetch(`/api/teacher/classes?schoolId=${schoolId}`, {
        headers: { "x-user-id": userId },
      });
      if (classRes.ok) {
        const classData = await classRes.json();
        setClasses(classData.classes || []);
      }

      // Fetch students
      const studentRes = await fetch(`/api/teacher/students?schoolId=${schoolId}`, {
        headers: { "x-user-id": userId },
      });

      if (!studentRes.ok) {
        throw new Error("Failed to fetch students");
      }

      const studentData = await studentRes.json();
      setStudents(studentData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleEditStudent = (studentData) => {
    setEditingStudent(studentData);
    setShowModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      const response = await fetch(
        `/api/teacher/students/${studentId}?schoolId=${activeSchoolId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": userId },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete student");
      }

      setStudents(students.filter((s) => s._id !== studentId));
      toast.success("Student deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const handleStudentSaved = () => {
    setShowModal(false);
    fetchData(activeSchoolId, userId);
  };

  const handleViewStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setShowDetailsModal(true);
  };

  const handleOpenParentAssignment = (student) => {
    setStudentForParentAssignment(student);
    setShowParentAssignmentModal(true);
  };

  const handleParentAssigned = () => {
    setShowParentAssignmentModal(false);
    setStudentForParentAssignment(null);
    fetchData(activeSchoolId, userId);
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Filter by class first
  let filteredStudents = selectedClass === "all" 
    ? students 
    : students.filter(s => s.class?._id === selectedClass);

  // Then filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredStudents = filteredStudents.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const enrollmentNo = (student.enrollmentNo || "").toLowerCase();
      const schoolType = (student.schoolType || "").toLowerCase().replace('my-childs-school', 'my childs school').replace('home-school', 'home school');
      const age = calculateAge(student.dateOfBirth);
      const ageStr = age ? age.toString() : "";

      return (
        fullName.includes(query) ||
        enrollmentNo.includes(query) ||
        schoolType.includes(query) ||
        ageStr.includes(query)
      );
    });
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to page 1 when filtering changes
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 md:flex-row md:justify-between md:items-center">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Students Management</h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage student information across all classes</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg text-xs md:text-base whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 md:w-5 h-4 md:h-5" />
            <span className="hidden sm:inline">Add Student</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Filter by Class */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Filter by Class</label>
          <select
            value={selectedClass}
            onChange={handleClassChange}
            className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-base bg-white cursor-pointer hover:border-gray-400 transition-colors"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="mb-3 sm:mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">Search Students</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, enrollment no., school type, or age..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 md:px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-base bg-white hover:border-gray-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Students Table/Cards */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-8 md:p-12 text-center">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-2 sm:mb-3 md:mb-4" />
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 mb-1 sm:mb-2">No students found</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-3 sm:mb-4 md:mb-6">Add your first student to get started</p>
            <button
              onClick={handleAddStudent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-lg inline-flex items-center gap-2 transition-colors text-xs sm:text-sm md:text-base"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">School Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Parent</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Enrollment</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedStudents.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{student.gender || "N/A"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-800">{student.class?.name || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">
                            {student.schoolType 
                              ? (student.schoolType === 'my-childs-school' ? "My Child's School" : "Home School")
                              : "N/A"
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {student.parent ? (
                            <button
                              onClick={() => {
                                setSelectedParentId(student.parent._id);
                                setShowParentProfileModal(true);
                              }}
                              className="flex items-center gap-2 hover:bg-green-50 rounded-lg p-1 transition-colors"
                            >
                              <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {student.parent.firstName.charAt(0)}{student.parent.lastName.charAt(0)}
                              </div>
                              <div className="text-sm text-left">
                                <p className="font-medium text-green-700 hover:underline cursor-pointer">{student.parent.firstName} {student.parent.lastName}</p>
                                <p className="text-xs text-gray-500">{student.parent.email}</p>
                              </div>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">{student.enrollmentNo || "—"}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudentForAccessCard(student);
                                setShowAccessCardModal(true);
                              }}
                              className="text-amber-600 hover:text-amber-800 transition-colors p-1"
                              title="View Access Card"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentForQR(student);
                                setShowQRModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors p-1"
                              title="Show QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewStudent(student._id)}
                              className="text-green-600 hover:text-green-800 transition-colors p-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentForFeedback(student);
                                setShowFeedbackPanel(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                              title="View Feedback"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStudentForNotebook(student);
                                setShowNotebookModal(true);
                              }}
                              className="text-amber-600 hover:text-amber-800 transition-colors p-1"
                              title="Upload Notebook Images"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenParentAssignment(student)}
                              className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                              title="Assign Parent"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(student._id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-1"
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
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 sm:space-y-4">
              {paginatedStudents.map((student) => (
                <div key={student._id} className="bg-white rounded-lg shadow-md p-3 sm:p-4 space-y-3">
                  {/* Student Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{student.gender || "N/A"}</p>
                      {student.email && (
                        <p className="text-xs text-gray-600 mt-1 break-all">{student.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 font-medium mb-0.5">Class</p>
                      <p className="text-gray-800 font-medium">{student.class?.name || "N/A"}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 font-medium mb-0.5">Phone</p>
                      <p className="text-gray-600">{student.phone || "—"}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 font-medium mb-0.5">Enrollment</p>
                      <p className="text-gray-600 font-medium">{student.enrollmentNo || "—"}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-gray-500 font-medium mb-0.5">Parent</p>
                      {student.parent ? (
                        <p className="text-gray-800 font-medium truncate">
                          {student.parent.firstName} {student.parent.lastName}
                        </p>
                      ) : (
                        <p className="text-gray-400 italic text-xs">Not assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Actions - Two rows */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    {/* First Row - Primary Actions */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudentForAccessCard(student);
                          setShowAccessCardModal(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="View Access Card"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Card</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudentForQR(student);
                          setShowQRModal(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="Show QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>QR</span>
                      </button>
                      <button
                        onClick={() => handleViewStudent(student._id)}
                        className="flex flex-col items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudentForFeedback(student);
                          setShowFeedbackPanel(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="View Feedback"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Feedback</span>
                      </button>
                    </div>

                    {/* Second Row - Secondary Actions */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudentForNotebook(student);
                          setShowNotebookModal(true);
                        }}
                        className="flex flex-col items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="Upload Notebook Images"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Notebook</span>
                      </button>
                      <button
                        onClick={() => handleOpenParentAssignment(student)}
                        className="flex flex-col items-center justify-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="Assign Parent"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Parent</span>
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="flex flex-col items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="Edit Student"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(student._id)}
                        className="flex flex-col items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition-colors text-xs font-medium"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 md:mt-8 flex flex-col gap-3 md:gap-4 bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
              <div className="text-xs sm:text-sm md:text-base text-gray-600 text-center md:text-left">
                Showing <span className="font-semibold">{startIndex + 1}</span> to <span className="font-semibold">{Math.min(endIndex, filteredStudents.length)}</span> of <span className="font-semibold">{filteredStudents.length}</span> students
              </div>

              <div className="flex items-center justify-center md:justify-end gap-1 sm:gap-2 md:gap-4 flex-wrap">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center gap-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Page Numbers - Show all on desktop, simplified on mobile */}
                <div className="flex gap-0.5 sm:gap-1 md:gap-2">
                  {totalPages <= 5 ? (
                    // Show all pages if 5 or fewer
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                      >
                        {page}
                      </button>
                    ))
                  ) : (
                    // Show smart pagination for many pages
                    <>
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => handlePageClick(1)}
                            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base"
                          >
                            1
                          </button>
                          {currentPage > 3 && <span className="px-1 py-1.5 text-gray-600">...</span>}
                        </>
                      )}
                      {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                        .filter((page) => page > 0 && page <= totalPages)
                        .map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && <span className="px-1 py-1.5 text-gray-600">...</span>}
                          <button
                            onClick={() => handlePageClick(totalPages)}
                            className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center gap-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 rounded-lg font-medium transition-colors text-xs sm:text-sm md:text-base"
                  title="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3 sm:w-4 h-3 sm:h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <StudentModal
          studentData={editingStudent}
          schoolId={activeSchoolId}
          userId={userId}
          classes={classes}
          onClose={() => setShowModal(false)}
          onSave={handleStudentSaved}
        />
      )}

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudentId && (
        <StudentDetailsModal
          studentId={selectedStudentId}
          schoolId={activeSchoolId}
          userId={userId}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Parent Assignment Modal */}
      {showParentAssignmentModal && studentForParentAssignment && (
        <ParentAssignmentModal
          studentData={studentForParentAssignment}
          schoolId={activeSchoolId}
          userId={userId}
          onClose={() => setShowParentAssignmentModal(false)}
          onAssign={handleParentAssigned}
        />
      )}

      {/* Parent Profile Modal */}
      {showParentProfileModal && selectedParentId && (
        <ParentProfileModal
          parentId={selectedParentId}
          onClose={() => {
            setShowParentProfileModal(false);
            setSelectedParentId(null);
          }}
        />
      )}

      {/* Student Feedback Panel */}
      {showFeedbackPanel && selectedStudentForFeedback && (
        <StudentFeedbackPanel
          studentId={selectedStudentForFeedback._id}
          studentName={`${selectedStudentForFeedback.firstName} ${selectedStudentForFeedback.lastName}`}
          schoolId={activeSchoolId}
          userId={userId}
          onClose={() => {
            setShowFeedbackPanel(false);
            setSelectedStudentForFeedback(null);
          }}
        />
      )}

      {/* QR Code Display Modal */}
      {showQRModal && selectedStudentForQR && (
        <QRCodeDisplay
          studentId={selectedStudentForQR._id}
          schoolId={activeSchoolId}
          userId={userId}
          studentName={`${selectedStudentForQR.firstName} ${selectedStudentForQR.lastName}`}
          onClose={() => {
            setShowQRModal(false);
            setSelectedStudentForQR(null);
          }}
        />
      )}

      {/* Access Card Modal */}
      {showAccessCardModal && selectedStudentForAccessCard && (
        <AccessCard
          student={{
            ...selectedStudentForAccessCard,
            name: `${selectedStudentForAccessCard.firstName} ${selectedStudentForAccessCard.lastName}`,
            className: selectedStudentForAccessCard.class?.name,
            gradeLevel: selectedStudentForAccessCard.gradeLevel || selectedStudentForAccessCard.class?.name,
          }}
          schoolName={schoolName}
          onClose={() => {
            setShowAccessCardModal(false);
            setSelectedStudentForAccessCard(null);
          }}
        />
      )}

      {/* Notebook Upload Modal */}
      {showNotebookModal && selectedStudentForNotebook && (
        <NotebookUploadModal
          studentId={selectedStudentForNotebook._id}
          studentName={`${selectedStudentForNotebook.firstName} ${selectedStudentForNotebook.lastName}`}
          schoolId={activeSchoolId}
          userId={userId}
          onClose={() => {
            setShowNotebookModal(false);
            setSelectedStudentForNotebook(null);
          }}
          onUploadSuccess={() => {
            // Optionally refresh student data
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 max-w-sm w-full">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Confirm Delete</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteStudent(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
