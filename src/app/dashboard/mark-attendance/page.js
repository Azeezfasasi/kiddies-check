"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle,
  Clock,
  Loader,
  ScanLine,
  Search,
  UserCheck,
  UserX,
  X,
  AlertCircle,
  Users,
  QrCode,
  List,
} from "lucide-react";
import toast from "react-hot-toast";
import AttendanceScanner from "@/app/components/AttendanceScanner";

export default function MarkAttendancePage() {
  const router = useRouter();
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [scannedStudent, setScannedStudent] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [markingStatus, setMarkingStatus] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [viewMode, setViewMode] = useState("scan"); // 'scan' | 'list'
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  useEffect(() => {
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const uid = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || !schoolId || !uid) {
      router.push("/login");
      return;
    }

    setActiveSchoolId(schoolId);
    setUserId(uid);
    setUserRole(role || "");
    setLoading(false);
    fetchTodayAttendance(schoolId, uid);
  }, [router, selectedDate]);

  const fetchTodayAttendance = async (schoolId, uid) => {
    try {
      setAttendanceLoading(true);
      const res = await fetch(
        `/api/teacher/attendance?schoolId=${schoolId}&date=${selectedDate}`,
        { headers: { "x-user-id": uid } }
      );
      if (res.ok) {
        const data = await res.json();
        setTodayAttendance(data.data || []);
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleScanSuccess = (student) => {
    setScannedStudent(student);
    setSearchResults([]);
    setSearchQuery("");
  };

  const markAttendance = async (status) => {
    if (!scannedStudent || !activeSchoolId || !userId) return;

    try {
      setMarkingStatus(status);
      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          schoolId: activeSchoolId,
          studentId: scannedStudent._id,
          date: selectedDate,
          status,
          markedVia: "qr-scan",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark attendance");
      }

      toast.success(`Marked ${scannedStudent.firstName} ${scannedStudent.lastName} as ${status}`);
      setScannedStudent(null);
      fetchTodayAttendance(activeSchoolId, userId);
    } catch (error) {
      console.error("Mark attendance error:", error);
      toast.error(error.message);
    } finally {
      setMarkingStatus(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !activeSchoolId || !userId) return;

    try {
      setSearching(true);
      const res = await fetch(
        `/api/teacher/students?schoolId=${activeSchoolId}`,
        { headers: { "x-user-id": userId } }
      );

      if (!res.ok) throw new Error("Failed to fetch students");

      const data = await res.json();
      const students = data.data || [];
      const query = searchQuery.toLowerCase();

      const filtered = students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(query) ||
          s.lastName.toLowerCase().includes(query) ||
          (s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(query))
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "absent":
        return "bg-red-100 text-red-700 border-red-200";
      case "late":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="w-4 h-4" />;
      case "absent":
        return <UserX className="w-4 h-4" />;
      case "late":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const stats = {
    present: todayAttendance.filter((a) => a.status === "present").length,
    absent: todayAttendance.filter((a) => a.status === "absent").length,
    late: todayAttendance.filter((a) => a.status === "late").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 md:mb-8 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mark Attendance</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
              Scan student QR codes or search manually to mark attendance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button
                onClick={() => setViewMode("scan")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "scan"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <QrCode className="w-4 h-4" />
                Scan
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
                Manual
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.present}</p>
                <p className="text-xs text-gray-500 font-medium">Present</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.absent}</p>
                <p className="text-xs text-gray-500 font-medium">Absent</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-4 md:p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.late}</p>
                <p className="text-xs text-gray-500 font-medium">Late</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Scanner or Search */}
          <div className="space-y-6">
            {/* Date Selector */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchTodayAttendance(activeSchoolId, userId);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            {viewMode === "scan" ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ScanLine className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">QR Code Scanner</h2>
                </div>
                <AttendanceScanner
                  schoolId={activeSchoolId}
                  userId={userId}
                  onScanSuccess={handleScanSuccess}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Search Student</h2>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search by name or enrollment number..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {searching ? <Loader className="w-4 h-4 animate-spin" /> : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {searchResults.map((student) => (
                      <button
                        key={student._id}
                        onClick={() => handleScanSuccess(student)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {student.firstName.charAt(0)}
                          {student.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.enrollmentNo} • {student.class?.name || "N/A"}
                          </p>
                        </div>
                        <UserCheck className="w-4 h-4 text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <div className="text-center py-6 text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No students found</p>
                  </div>
                )}
              </div>
            )}

            {/* Scanned Student Actions */}
            {scannedStudent && (
              <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-5 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {scannedStudent.firstName.charAt(0)}
                      {scannedStudent.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        {scannedStudent.firstName} {scannedStudent.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {scannedStudent.enrollmentNo} • {scannedStudent.class?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setScannedStudent(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">Select attendance status:</p>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => markAttendance("present")}
                    disabled={markingStatus !== null}
                    className="flex flex-col items-center gap-2 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-semibold transition-colors disabled:opacity-50"
                  >
                    {markingStatus === "present" ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    Present
                  </button>
                  <button
                    onClick={() => markAttendance("late")}
                    disabled={markingStatus !== null}
                    className="flex flex-col items-center gap-2 py-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold transition-colors disabled:opacity-50"
                  >
                    {markingStatus === "late" ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                    Late
                  </button>
                  <button
                    onClick={() => markAttendance("absent")}
                    disabled={markingStatus !== null}
                    className="flex flex-col items-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold transition-colors disabled:opacity-50"
                  >
                    {markingStatus === "absent" ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <UserX className="w-5 h-5" />
                    )}
                    Absent
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Today's Attendance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>
              <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                {todayAttendance.length} records
              </span>
            </div>

            {attendanceLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-gray-500 text-sm">Loading attendance...</p>
              </div>
            ) : todayAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Calendar className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No attendance records yet</p>
                <p className="text-xs mt-1">Scan a QR code or search to mark attendance</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {todayAttendance.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {record.student?.firstName?.charAt(0) || "?"}
                      {record.student?.lastName?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {record.student?.firstName} {record.student?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.student?.enrollmentNo} • {record.markedVia === "qr-scan" ? "QR Scan" : "Manual"}
                      </p>
                    </div>
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusIcon(record.status)}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

