"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, Users, BookOpen, MessageSquare, TrendingUp, Clock } from "lucide-react";
import toast from "react-hot-toast";
import StudentDetailsModal from "@/app/components/StudentDetailsModal";
import StudentFeedbackPanel from "@/app/components/StudentFeedbackPanel";

export default function MyChildrenPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackLoadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    // Redirect if not a parent or not logged in
    if (!token || !userId || !schoolId || schoolId === "null" || schoolId === "undefined") {
      router.push("/login");
      return;
    }

    if (userRole !== "parent") {
      router.push("/login");
      return;
    }

    setActiveSchoolId(schoolId);
    setUserId(userId);
    fetchMyChildren(schoolId, userId);
  }, [router]);

  const fetchMyChildren = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/parent/students?schoolId=${schoolId}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load your children");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleViewFeedback = async (student) => {
    setSelectedStudent(student);
    setLoadingFeedback(true);
    try {
      const response = await fetch(
        `/api/teacher/feedback?studentId=${student._id}&schoolId=${activeSchoolId}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedbackData(data.feedback || []);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoadingFeedback(false);
      setShowFeedback(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading your children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">My Children</h1>
          <p className="text-gray-600 mt-2">Monitor progress and stay connected with your child's school journey</p>
        </div>

        {/* Students List */}
        {students.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No children assigned yet</h2>
            <p className="text-gray-600">Your account is not yet linked to any students. Please contact your school.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-t-4 border-blue-500"
              >
                {/* Card Header */}
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{student.class?.name || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-4">
                  {/* Student Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Enrollment</p>
                      <p className="text-gray-800 font-semibold">{student.enrollmentNo || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium mb-1">Gender</p>
                      <p className="text-gray-800 font-semibold capitalize">{student.gender || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 font-medium mb-1">Email</p>
                      <p className="text-gray-800 truncate text-sm">{student.email || "Not provided"}</p>
                    </div>
                  </div>

                  {/* Admission Info */}
                  {student.admissionDate && (
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div className="text-sm">
                        <p className="text-gray-600">Admitted</p>
                        <p className="text-gray-800 font-semibold">
                          {new Date(student.admissionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="border-t bg-gray-50 p-4 flex gap-2">
                  <button
                    onClick={() => handleViewStudent(student)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Details
                  </button>
                  <button
                    onClick={() => handleViewFeedback(student)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Feedback
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          studentId={selectedStudent._id}
          schoolId={activeSchoolId}
          userId={userId}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Feedback Panel Modal */}
      {showFeedback && selectedStudent && (
        <StudentFeedbackPanel
          studentId={selectedStudent._id}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          schoolId={activeSchoolId}
          userId={userId}
          initialFeedback={feedbackData}
          feedbackLoading={feedbackLoadingFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
