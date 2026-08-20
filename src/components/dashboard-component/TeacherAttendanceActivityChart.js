"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader, Users } from "lucide-react";

export default function TeacherAttendanceActivityChart({
  schoolId = null,
  title = "Attendance Activity by Teachers",
}) {
  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getToday);
  const [endDate, setEndDate] = useState(getToday);
  const [days, setDays] = useState([]);
  const [activeTeachers, setActiveTeachers] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);

  useEffect(() => {
    const sid = schoolId || localStorage.getItem("schoolId");
    if (sid) {
      fetchActivity(sid);
    }
  }, [schoolId, startDate, endDate]);

  const enumerateDates = (start, end) => {
    const dates = [];
    let current = new Date(`${start}T00:00:00`);
    const last = new Date(`${end}T00:00:00`);
    while (current <= last) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, "0");
      const day = String(current.getDate()).padStart(2, "0");
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const toDateKey = (isoDate) => {
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchActivity = async (sid) => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const [classesRes, attendanceRes] = await Promise.all([
        fetch(`/api/teacher/classes?schoolId=${sid}`, {
          headers: { "x-user-id": userId },
        }),
        fetch(
          `/api/teacher/attendance?schoolId=${sid}&startDate=${startDate}&endDate=${endDate}`,
          { headers: { "x-user-id": userId } }
        ),
      ]);

      if (!classesRes.ok || !attendanceRes.ok) return;

      const classesData = await classesRes.json();
      const attendanceData = await attendanceRes.json();

      const classList = (classesData.classes || []).map((c) => c.name);
      const records = attendanceData.data || [];

      // Group records by date -> class -> { teachers, present, late, absent }
      const grouped = {};
      records.forEach((record) => {
        const dateKey = toDateKey(record.date);
        const className = record.student?.class?.name || "Unassigned";
        const teacherName = record.markedBy
          ? `${record.markedBy.firstName || ""} ${record.markedBy.lastName || ""}`.trim()
          : "Unknown";

        if (!grouped[dateKey]) grouped[dateKey] = {};
        if (!grouped[dateKey][className]) {
          grouped[dateKey][className] = {
            teachers: new Set(),
            present: 0,
            late: 0,
            absent: 0,
          };
        }

        grouped[dateKey][className].teachers.add(teacherName);
        if (record.status === "present") grouped[dateKey][className].present += 1;
        else if (record.status === "late") grouped[dateKey][className].late += 1;
        else if (record.status === "absent") grouped[dateKey][className].absent += 1;
      });

      const dateKeys =
        startDate && endDate
          ? enumerateDates(startDate, endDate)
          : Object.keys(grouped).sort().reverse();

      const teachersSeen = new Set();

      const dayRows = dateKeys
        .map((dateKey) => {
          const classesForDay = classList.map((className) => {
            const entry = grouped[dateKey]?.[className];
            if (entry) {
              entry.teachers.forEach((t) => teachersSeen.add(t));
            }
            return {
              className,
              marked: !!entry,
              teachers: entry ? Array.from(entry.teachers) : [],
              present: entry?.present || 0,
              late: entry?.late || 0,
              absent: entry?.absent || 0,
            };
          });

          return { date: dateKey, classes: classesForDay };
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1));

      setDays(dayRows);
      setTotalClasses(classList.length);
      setActiveTeachers(teachersSeen.size);
    } catch (error) {
      console.error("Fetch attendance activity error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = (dateKey) => {
    const d = new Date(`${dateKey}T00:00:00`);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex items-center justify-center h-64 gap-3">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading attendance activity...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-300 shadow-lg p-6 space-y-6 mt-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          Track which classes marked attendance each day and the teacher who marked it
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 lg:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-700">Classes Tracked</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{totalClasses}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-700" />
            <p className="text-sm font-semibold text-purple-700">Teachers Active</p>
          </div>
          <p className="text-3xl font-bold text-purple-600 mt-1">{activeTeachers}</p>
        </div>
      </div>

      {/* Per-day breakdown */}
      {totalClasses === 0 ? (
        <p className="text-sm text-gray-500">No classes found for this school.</p>
      ) : days.length === 0 ? (
        <p className="text-sm text-gray-500">No attendance activity found for the selected period.</p>
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <div key={day.date} className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-800">{formatDateLabel(day.date)}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                      <th className="px-4 py-2 font-medium">Class</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Marked By</th>
                      <th className="px-4 py-2 font-medium">Present / Late / Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.classes.map((cls) => (
                      <tr key={cls.className} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2 font-medium text-gray-800">{cls.className}</td>
                        <td className="px-4 py-2">
                          {cls.marked ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 text-xs font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Marked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 text-xs font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Not Marked
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {cls.teachers.length > 0 ? cls.teachers.join(", ") : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {cls.marked ? `${cls.present} / ${cls.late} / ${cls.absent}` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
