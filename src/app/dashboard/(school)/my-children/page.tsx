"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader, Users, MessageSquare, TrendingUp, Clock, FileText, GraduationCap, Wallet, ChevronRight, Hash, Mail, School } from "lucide-react";
import toast from "react-hot-toast";
import StudentDetailsModal from "@/app/components/StudentDetailsModal";
import StudentFeedbackPanel from "@/app/components/StudentFeedbackPanel";
import StudentNotebookGallery from "@/app/components/StudentNotebookGallery";
import StudentReportCardsPanel from "@/app/components/StudentReportCardsPanel";
import StudentExamResultsPanel from "@/app/components/StudentExamResultsPanel";
import StudentFeesPanel from "@/app/components/StudentFeesPanel";

export default function MyChildrenPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showReportCards, setShowReportCards] = useState(false);
  const [showExamResults, setShowExamResults] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackLoadingFeedback, setLoadingFeedback] = useState(false);
  const [currentChildId, setCurrentChildId] = useState("");

  // Each child's own school (children can attend different schools)
  const schoolIdOf = (student) => student?.school?._id || student?.school || activeSchoolId;
  const hasSeveralSchools = new Set(students.map((s) => String(s.school?._id || s.school))).size > 1;

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
  }, []);

  const fetchMyChildren = useCallback(async (schoolId, userId) => {
    try {
      setLoading(true);
      // Every child linked to this parent, whichever school they attend
      const response = await fetch(
        `/api/parent/students`,
        {
          headers: { 
            "x-user-id": userId,
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
      setCurrentChildId((current) => current || data.students?.[0]?._id || "");
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load your children");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowDetailsModal(true);
  };

  const handleViewReportCards = (student) => {
    setSelectedStudent(student);
    setShowReportCards(true);
  };

  const handleViewExamResults = (student) => {
    setSelectedStudent(student);
    setShowExamResults(true);
  };


  const handleViewFeedback = async (student) => {
    setSelectedStudent(student);
    setLoadingFeedback(true);
    try {
      const response = await fetch(
        `/api/teacher/feedback?studentId=${student._id}&schoolId=${schoolIdOf(student)}`,
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
          <p className="text-gray-600 mt-2">Monitor progress and stay connected with your child&apos;s school journey</p>
        </div>

        {/* Students */}
        {students.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No children assigned yet</h2>
            <p className="text-gray-600">Your account is not yet linked to any students. Please contact your school.</p>
          </div>
        ) : (
          (() => {
            const child = students.find((s) => s._id === currentChildId) || students[0];
            const initials = `${child.firstName?.charAt(0) || ""}${child.lastName?.charAt(0) || ""}`;
            const actions = [
              { label: "Progress details", description: "Attendance, scores and subjects", Icon: TrendingUp, tone: "bg-blue-50 text-blue-700", onClick: () => handleViewStudent(child) },
              { label: "Feedback", description: "Notes from school and your replies", Icon: MessageSquare, tone: "bg-green-50 text-green-700", onClick: () => handleViewFeedback(child) },
              { label: "Report cards", description: "View and download report cards", Icon: FileText, tone: "bg-purple-50 text-purple-700", onClick: () => handleViewReportCards(child) },
              { label: "Exam results", description: "CBT exam scores", Icon: GraduationCap, tone: "bg-indigo-50 text-indigo-700", onClick: () => handleViewExamResults(child) },
              {
                label: "School fees",
                description: "Bills and payments",
                Icon: Wallet,
                tone: "bg-amber-50 text-amber-700",
                onClick: () => {
                  setSelectedStudent(child);
                  setShowFees(true);
                },
              },
            ];

            return (
              <div className="space-y-6">
                {/* Child switcher */}
                {students.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-1" role="tablist" aria-label="Choose a child">
                    {students.map((s) => {
                      const selected = s._id === child._id;
                      return (
                        <button
                          key={s._id}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          onClick={() => setCurrentChildId(s._id)}
                          className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                            selected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-300"
                          }`}
                        >
                          {s.picture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {s.firstName?.charAt(0)}{s.lastName?.charAt(0)}
                            </span>
                          )}
                          <span>
                            <span className="block text-sm font-semibold text-gray-900">{s.firstName} {s.lastName}</span>
                            <span className="block text-xs text-gray-500">
                              {s.class?.name || "No class"}
                              {hasSeveralSchools && s.school?.name ? ` · ${s.school.name}` : ""}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-5">
                  {/* Profile + actions */}
                  <div className="space-y-6 lg:col-span-3">
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        {child.picture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={child.picture} alt="" className="h-16 w-16 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xl font-bold text-white">
                            {initials}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h2 className="text-xl font-bold text-gray-900">{child.firstName} {child.lastName}</h2>
                          <p className="text-sm text-gray-600">
                            {child.class?.name || "No class"}
                            {child.school?.name ? ` · ${child.school.name}` : ""}
                          </p>
                        </div>
                      </div>

                      <dl className="mt-5 grid gap-4 border-t border-gray-100 pt-5 text-sm sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <Hash className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                          <div>
                            <dt className="text-gray-500">Enrollment no.</dt>
                            <dd className="font-medium text-gray-900">{child.enrollmentNo || "—"}</dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                          <div>
                            <dt className="text-gray-500">Admitted</dt>
                            <dd className="font-medium text-gray-900">
                              {child.admissionDate ? new Date(child.admissionDate).toLocaleDateString() : "—"}
                            </dd>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <School className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                          <div>
                            <dt className="text-gray-500">Gender</dt>
                            <dd className="font-medium capitalize text-gray-900">{child.gender || "—"}</dd>
                          </div>
                        </div>
                        <div className="flex min-w-0 items-start gap-2">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                          <div className="min-w-0">
                            <dt className="text-gray-500">Email</dt>
                            <dd className="truncate font-medium text-gray-900">{child.email || "Not provided"}</dd>
                          </div>
                        </div>
                      </dl>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {actions.map(({ label, description, Icon, tone, onClick }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={onClick}
                          className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-gray-900">{label}</span>
                            <span className="block text-xs text-gray-500">{description}</span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-blue-600" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notebook */}
                  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
                    <StudentNotebookGallery
                      key={child._id}
                      studentId={child._id}
                      studentName={`${child.firstName} ${child.lastName}`}
                      userId={userId}
                    />
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal
          studentId={selectedStudent._id}
          schoolId={schoolIdOf(selectedStudent)}
          userId={userId}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {/* Feedback Panel Modal */}
      {showFeedback && selectedStudent && (
        <StudentFeedbackPanel
          studentId={selectedStudent._id}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          schoolId={schoolIdOf(selectedStudent)}
          userId={userId}
          initialFeedback={feedbackData}
          feedbackLoading={feedbackLoadingFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* Report Cards Panel Modal */}
      {showReportCards && selectedStudent && (
        <StudentReportCardsPanel
          studentId={selectedStudent._id}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          schoolId={schoolIdOf(selectedStudent)}
          userId={userId}
          schoolName={selectedStudent.school?.name || localStorage.getItem("schoolName") || ""}
          schoolLogo={selectedStudent.school?.logo || localStorage.getItem("schoolLogo") || ""}
          onClose={() => setShowReportCards(false)}
        />
      )}

      {/* School Fees Panel Modal */}
      {showFees && selectedStudent && (
        <StudentFeesPanel
          studentId={selectedStudent._id}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          onClose={() => setShowFees(false)}
        />
      )}

      {/* Exam Results Panel Modal */}
      {showExamResults && selectedStudent && (
        <StudentExamResultsPanel
          studentId={selectedStudent._id}
          studentName={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
          schoolId={schoolIdOf(selectedStudent)}
          userId={userId}
          onClose={() => setShowExamResults(false)}
        />
      )}
    </div>
  );
}
