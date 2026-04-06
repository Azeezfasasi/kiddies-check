"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, AlertCircle, Loader, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import AssessmentModal from "@/app/components/AssessmentModal";
import TrendChart from "@/app/components/TrendChart";

export default function StudentAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState([]);
  const [trends, setTrends] = useState({});
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [expandedAssessments, setExpandedAssessments] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Try activeSchoolId first (for admins who switched schools), fall back to schoolId
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

      const headers = { "x-user-id": userId };

      // Fetch classes
      const classRes = await fetch(`/api/teacher/classes?schoolId=${schoolId}`, { headers });
      if (classRes.ok) {
        const classData = await classRes.json();
        setClasses(classData.classes || []);
      }

      // Fetch students
      const studentRes = await fetch(`/api/teacher/students?schoolId=${schoolId}`, { headers });
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudents(studentData.students || []);
      }

      // Fetch subjects
      const subjectRes = await fetch(`/api/teacher/subjects?schoolId=${schoolId}`, { headers });
      if (subjectRes.ok) {
        const subjectData = await subjectRes.json();
        setSubjects(subjectData.subjects || []);
      }

      // Fetch assessments
      const assessmentRes = await fetch(`/api/teacher/assessments?schoolId=${schoolId}`, { headers });
      if (assessmentRes.ok) {
        const assessmentData = await assessmentRes.json();
        setAssessments(assessmentData.assessments || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAssessment = () => {
    setEditingAssessment(null);
    setShowModal(true);
  };

  const handleEditAssessment = (assessmentData) => {
    setEditingAssessment(assessmentData);
    setShowModal(true);
  };

  const handleDeleteAssessment = async (assessmentId) => {
    try {
      const response = await fetch(
        `/api/teacher/assessments/${assessmentId}?schoolId=${activeSchoolId}`,
        {
          method: "DELETE",
          headers: { "x-user-id": userId },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete assessment");
      }

      setAssessments(assessments.filter((a) => a._id !== assessmentId));
      toast.success("Assessment deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting assessment:", error);
      toast.error("Failed to delete assessment");
    }
  };

  const handleAssessmentSaved = () => {
    setShowModal(false);
    fetchData(activeSchoolId, userId);
  };

  const toggleAssessmentExpand = (assessmentId) => {
    setExpandedAssessments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assessmentId)) {
        newSet.delete(assessmentId);
      } else {
        newSet.add(assessmentId);
      }
      return newSet;
    });
  };

  // Filter assessments
  let filteredAssessments = assessments;
  if (selectedStudent) {
    filteredAssessments = filteredAssessments.filter((a) => a.student?._id === selectedStudent);
  }
  if (selectedSubject) {
    filteredAssessments = filteredAssessments.filter((a) => a.subject?._id === selectedSubject);
  }
  if (selectedClass) {
    filteredAssessments = filteredAssessments.filter((a) => a.class?._id === selectedClass);
  }

  // Search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredAssessments = filteredAssessments.filter((a) => {
      const studentName = `${a.student?.firstName} ${a.student?.lastName}`.toLowerCase();
      const subjectName = a.subject?.name.toLowerCase();
      const className = a.class?.name.toLowerCase();
      const week = a.week?.toString();

      return (
        studentName.includes(query) ||
        subjectName.includes(query) ||
        className.includes(query) ||
        week.includes(query)
      );
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssessments = filteredAssessments.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStudent, selectedSubject, selectedClass, searchQuery]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Student Assessments</h1>
            <p className="text-gray-600 mt-2">Record and track student performance over time</p>
          </div>
          <button
            onClick={handleAddAssessment}
            className="flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Record Assessment
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, subject, class, or week..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredAssessments.length} result{filteredAssessments.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Assessments List */}
        {filteredAssessments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No assessments found</h2>
            <p className="text-gray-600 mb-6">Start recording assessments to track student progress</p>
            <button
              onClick={handleAddAssessment}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Record Assessment
            </button>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              {paginatedAssessments.map((assessment) => {
                const isExpanded = expandedAssessments.has(assessment._id);
                return (
                  <div key={assessment._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Collapsible Header */}
                    <div className="border-l-4 border-purple-600 p-6">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <button
                            onClick={() => toggleAssessmentExpand(assessment._id)}
                            className="flex items-center gap-3 w-full text-left hover:opacity-70 transition-opacity"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-800">
                                  {assessment.student?.firstName} {assessment.student?.lastName}
                                </h3>
                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                                  {assessment.subject?.name}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm">
                                {assessment.class?.name} • Week {assessment.week}
                              </p>
                            </div>
                          </button>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEditAssessment(assessment)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(assessment._id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pl-8">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg">
                          <p className="text-gray-600 text-xs mb-1">Score</p>
                          <p className="text-xl font-bold text-purple-600">{assessment.score}%</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg">
                          <p className="text-gray-600 text-xs mb-1">Type</p>
                          <p className="text-sm font-semibold text-blue-600 capitalize">{assessment.assessmentType}</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg">
                          <p className="text-gray-600 text-xs mb-1">Date</p>
                          <p className="text-sm font-semibold text-green-600">
                            {new Date(assessment.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-3 rounded-lg">
                          <p className="text-gray-600 text-xs mb-1">Grade</p>
                          <p className="text-xl font-bold text-yellow-600">{assessment.gradeLevel || "—"}</p>
                        </div>
                      </div>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <div className="mt-6 pl-8 space-y-4 border-t pt-4">
                          {/* Remarks */}
                          {assessment.remarks && (
                            <div className="p-4 bg-gray-50 rounded-lg border-l-2 border-gray-300">
                              <p className="text-sm font-semibold text-gray-700 mb-1">Remarks</p>
                              <p className="text-gray-600">{assessment.remarks}</p>
                            </div>
                          )}

                          {/* Trend Chart */}
                          <TrendChart
                            studentId={assessment.student?._id}
                            subjectId={assessment.subject?._id}
                            schoolId={activeSchoolId}
                            userId={userId}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>
                </div>

                <div className="flex items-center justify-between md:justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                          currentPage === page
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Next
                  </button>
                </div>

                <div className="text-sm text-gray-600 text-center md:text-right">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAssessments.length)} of{" "}
                  {filteredAssessments.length} assessments
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <AssessmentModal
          assessmentData={editingAssessment}
          schoolId={activeSchoolId}
          userId={userId}
          classes={classes}
          students={students}
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onSave={handleAssessmentSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this assessment? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAssessment(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
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
