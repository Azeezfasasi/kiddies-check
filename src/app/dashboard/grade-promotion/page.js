"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Loader,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  School,
  Users,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";

export default function GradePromotionPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [academicSession, setAcademicSession] = useState("");
  const [classGroups, setClassGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState(new Set());
  const [promotionMappings, setPromotionMappings] = useState({});
  const [retainedStudents, setRetainedStudents] = useState(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySession, setHistorySession] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    fetchSchools(t);
  }, [router]);

  const fetchSchools = async (t) => {
    try {
      const res = await fetch("/api/schools", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        setSchools(data.schools || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchEligibleStudents = async () => {
    if (!selectedSchool || !academicSession) {
      toast.error("Please select a school and academic session");
      return;
    }
    try {
      setFetching(true);
      const res = await fetch(
        `/api/admin/promotions?schoolId=${selectedSchool}&academicSession=${encodeURIComponent(
          academicSession
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setClassGroups(data.classGroups || []);
        setExpandedClasses(new Set());
        setPromotionMappings({});
        setRetainedStudents(new Set());
        setPreviewMode(false);
      } else {
        toast.error(data.message || "Failed to fetch students");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setFetching(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      let url = `/api/admin/promotions/history?schoolId=${selectedSchool}&page=1&limit=100`;
      if (historySession) {
        url += `&academicSession=${encodeURIComponent(historySession)}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setHistoryRecords(data.records || []);
      } else {
        toast.error(data.message || "Failed to fetch history");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleClass = (classId) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      return next;
    });
  };

  const setTargetClass = (fromClassId, toClassId) => {
    setPromotionMappings((prev) => ({ ...prev, [fromClassId]: toClassId }));
  };

  const toggleRetainStudent = (studentId) => {
    setRetainedStudents((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const getPreviewCounts = () => {
    let promoted = 0;
    let retained = 0;
    let graduated = 0;

    classGroups.forEach((group) => {
      const fromClassId = group.class._id;
      const toClassId = promotionMappings[fromClassId];
      group.students.forEach((s) => {
        if (s.alreadyPromoted) return;
        if (retainedStudents.has(s._id)) {
          retained++;
        } else if (toClassId === "graduate" || !toClassId) {
          graduated++;
        } else if (toClassId) {
          promoted++;
        }
      });
    });

    return { promoted, retained, graduated };
  };

  const handleRunPromotion = async () => {
    const mappings = [];
    classGroups.forEach((group) => {
      const fromClassId = group.class._id;
      const toClassId = promotionMappings[fromClassId];
      const retainedIds = group.students
        .filter((s) => retainedStudents.has(s._id) && !s.alreadyPromoted)
        .map((s) => s._id);

      if (toClassId || retainedIds.length > 0) {
        mappings.push({
          fromClassId,
          toClassId: toClassId === "graduate" ? null : toClassId,
          retainedStudentIds: retainedIds,
        });
      }
    });

    if (mappings.length === 0) {
      toast.error("No promotions configured");
      return;
    }

    try {
      setPromoting(true);
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          schoolId: selectedSchool,
          academicSession,
          mappings,
          remarks: `End of session promotion for ${academicSession}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchEligibleStudents();
      } else {
        toast.error(data.message || "Failed to run promotion");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setPromoting(false);
    }
  };

  const preview = getPreviewCounts();
  const hasConfiguredMappings = Object.keys(promotionMappings).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Grade Promotion
            </h1>
            <p className="text-gray-600 mt-1">
              Promote pupils to the next class at the end of an academic session
            </p>
          </div>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchHistory();
            }}
            className="flex justify-center items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-sm"
          >
            <History className="w-5 h-5" />
            {showHistory ? "Hide History" : "View History"}
          </button>
        </div>

        {showHistory ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Promotion History
              </h2>
              <div className="flex gap-3 ml-auto">
                <input
                  type="text"
                  placeholder="Filter by session e.g. 2026/2027"
                  value={historySession}
                  onChange={(e) => setHistorySession(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchHistory}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Filter className="w-4 h-4 inline mr-1" />
                  Filter
                </button>
              </div>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No promotion records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Student
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        From Class
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        To Class
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Session
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Promoted By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {historyRecords.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">
                            {record.student?.firstName} {record.student?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.student?.enrollmentNo || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {record.fromClass?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {record.status === "retained"
                            ? "—"
                            : record.toClass?.name || "Graduated"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {record.academicSession}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === "promoted"
                                ? "bg-green-100 text-green-700"
                                : record.status === "retained"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            {record.status.charAt(0).toUpperCase() +
                              record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(record.promotionDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {record.promotedBy?.firstName}{" "}
                          {record.promotedBy?.lastName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => {
                      setSelectedSchool(e.target.value);
                      setClassGroups([]);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select school</option>
                    {schools.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Session <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 2026/2027"
                    value={academicSession}
                    onChange={(e) => {
                      setAcademicSession(e.target.value);
                      setClassGroups([]);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchEligibleStudents}
                    disabled={fetching || !selectedSchool || !academicSession}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {fetching ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Users className="w-4 h-4" />
                    )}
                    Load Students
                  </button>
                </div>
              </div>
            </div>

            {classGroups.length > 0 && (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <School className="w-5 h-5 text-blue-600" />
                      Promotion Configuration
                    </h2>
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {previewMode ? "Hide Preview" : "Show Preview"}
                    </button>
                  </div>

                  {previewMode && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {preview.promoted}
                        </div>
                        <div className="text-sm text-gray-600">To Promote</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {preview.retained}
                        </div>
                        <div className="text-sm text-gray-600">To Retain</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {preview.graduated}
                        </div>
                        <div className="text-sm text-gray-600">To Graduate</div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {classGroups.map((group) => {
                      const fromId = group.class._id;
                      const isExpanded = expandedClasses.has(fromId);
                      const targetClass = promotionMappings[fromId];
                      const allClasses = classGroups.map((g) => g.class);

                      return (
                        <div
                          key={fromId}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleClass(fromId)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )}
                              <span className="font-semibold text-gray-800">
                                {group.class.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                ({group.studentCount} students)
                              </span>
                              {targetClass && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  {targetClass === "graduate"
                                    ? "Graduate"
                                    : `To: ${
                                        allClasses.find(
                                          (c) => c._id === targetClass
                                        )?.name || ""
                                      }`}
                                </span>
                              )}
                            </div>
                            <select
                              value={targetClass || ""}
                              onChange={(e) => {
                                e.stopPropagation();
                                setTargetClass(fromId, e.target.value || null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="">Select target...</option>
                              {allClasses
                                .filter((c) => c._id !== fromId)
                                .map((c) => (
                                  <option key={c._id} value={c._id}>
                                    Promote to {c.name}
                                  </option>
                                ))}
                              <option value="graduate">Graduate</option>
                            </select>
                          </button>

                          {isExpanded && (
                            <div className="p-4">
                              {group.students.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">
                                  No students in this class
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {group.students.map((student) => {
                                    const isRetained = retainedStudents.has(
                                      student._id
                                    );
                                    const isPromoted = student.alreadyPromoted;
                                    return (
                                      <div
                                        key={student._id}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${
                                          isPromoted
                                            ? "bg-green-50 border-green-200"
                                            : isRetained
                                            ? "bg-yellow-50 border-yellow-200"
                                            : "bg-white border-gray-200"
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                            {student.firstName.charAt(0)}
                                            {student.lastName.charAt(0)}
                                          </div>
                                          <div>
                                            <p className="font-medium text-gray-800 text-sm">
                                              {student.firstName}{" "}
                                              {student.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                              {student.enrollmentNo || "—"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {isPromoted ? (
                                            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                                              <CheckCircle className="w-3 h-3" />
                                              Already promoted
                                            </span>
                                          ) : (
                                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={isRetained}
                                                onChange={() =>
                                                  toggleRetainStudent(
                                                    student._id
                                                  )
                                                }
                                                className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                                              />
                                              Retain
                                            </label>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {hasConfiguredMappings && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setPreviewMode(true)}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Preview
                      </button>
                      <button
                        onClick={handleRunPromotion}
                        disabled={promoting}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        {promoting ? (
                          <Loader className="w-4 h-4 animate-spin" />
                        ) : (
                          <GraduationCap className="w-4 h-4" />
                        )}
                        Run Promotion
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

