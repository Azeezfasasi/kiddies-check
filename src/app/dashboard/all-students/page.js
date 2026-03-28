"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, AlertCircle, Loader, Users, Eye } from "lucide-react";
import toast from "react-hot-toast";
import StudentModal from "@/app/components/StudentModal";
import StudentDetailsModal from "@/app/components/StudentDetailsModal";

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
      setStudents(studentData.students || []);
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

  const filteredStudents = selectedClass === "all" 
    ? students 
    : students.filter(s => s.class?._id === selectedClass);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 md:mb-8 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Students Management</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Manage student information across all classes</p>
          </div>
          <button
            onClick={handleAddStudent}
            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg text-sm md:text-base"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>

        {/* Filter by Class */}
        <div className="mb-4 md:mb-6">
          <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">Filter by Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {/* Students Table/Cards */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 md:p-12 text-center">
            <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No students found</h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">Add your first student to get started</p>
            <button
              onClick={handleAddStudent}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg inline-flex items-center gap-2 transition-colors text-sm md:text-base"
            >
              <Plus className="w-5 h-5" />
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
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Enrollment</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((student) => (
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
                          <span className="text-gray-600 text-sm">{student.email || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">{student.phone || "—"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-600 text-sm">{student.enrollmentNo || "—"}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewStudent(student._id)}
                              className="text-green-600 hover:text-green-800 transition-colors p-1"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
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
              {filteredStudents.map((student) => (
                <div key={student._id} className="bg-white rounded-lg shadow-md p-4 space-y-3">
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
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Class</p>
                      <p className="text-gray-800">{student.class?.name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Phone</p>
                      <p className="text-gray-600">{student.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Enrollment No.</p>
                      <p className="text-gray-600">{student.enrollmentNo || "—"}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleViewStudent(student._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-600 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleEditStudent(student)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(student._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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
