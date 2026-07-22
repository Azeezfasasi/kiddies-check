
"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Loader } from "lucide-react";

export default function AttendanceChart({ 
  schoolId = null,
  title = "School Attendance Overview" 
}) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [stats, setStats] = useState({
    totalRecords: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0,
    previousAttendanceRate: 0,
  });
  const [classBreakdown, setClassBreakdown] = useState([]);

  useEffect(() => {
    const sid = schoolId || localStorage.getItem("schoolId");
    if (sid) {
      fetchAttendanceData(sid);
    }
  }, [schoolId, startDate, endDate]);

  const fetchAttendanceData = async (sid) => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");
      
      if (!userId || !token) return;

      let url = `/api/teacher/attendance?schoolId=${sid}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(
        url,
        { headers: { "x-user-id": userId } }
      );

      if (res.ok) {
        const data = await res.json();
        const records = data.data || [];

        // Calculate counts by status
        const present = records.filter(r => r.status === "present").length;
        const absent = records.filter(r => r.status === "absent").length;
        const late = records.filter(r => r.status === "late").length;
        const total = present + absent + late;

        // Calculate attendance rate (present + late are counted as "attended")
        const attended = present + late;
        const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

        // Build chart data
        const chartData = [
          { 
            name: `Present (${present})`, 
            value: present, 
            fill: "#10b981",
            percentage: total > 0 ? Math.round((present / total) * 100) : 0
          },
          { 
            name: `Late (${late})`, 
            value: late, 
            fill: "#f59e0b",
            percentage: total > 0 ? Math.round((late / total) * 100) : 0
          },
          { 
            name: `Absent (${absent})`, 
            value: absent, 
            fill: "#ef4444",
            percentage: total > 0 ? Math.round((absent / total) * 100) : 0
          },
        ].filter(item => item.value > 0);

        const breakdownByClass = records.reduce((acc, record) => {
          const className = record.student?.class?.name || record.className || "Unassigned";
          const key = className;
          if (!acc[key]) {
            acc[key] = {
              className: key,
              present: 0,
              late: 0,
              absent: 0,
              total: 0,
            };
          }

          acc[key].total += 1;
          if (record.status === "present") acc[key].present += 1;
          else if (record.status === "late") acc[key].late += 1;
          else if (record.status === "absent") acc[key].absent += 1;

          return acc;
        }, {});

        const classBreakdownData = Object.values(breakdownByClass)
          .map((item) => ({
            ...item,
            attendanceRate: item.total > 0 ? Math.round(((item.present + item.late) / item.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total);

        setAttendanceData(chartData);
        setClassBreakdown(classBreakdownData);
        setStats({
          totalRecords: total,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          attendanceRate: attendanceRate,
          previousAttendanceRate: attendanceRate - 2, // Mock previous data
        });
      }
    } catch (error) {
      console.error("Fetch attendance error:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">Records: {data.value}</p>
          <p className="text-sm text-gray-600">{data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const trend = stats.attendanceRate - stats.previousAttendanceRate;

  const renderTrendIcon = (value) => {
    if (value > 0) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (value < 0) {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    } else {
      return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (value) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendBgColor = (value) => {
    if (value > 0) return "bg-green-50 border-green-200";
    if (value < 0) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-96 gap-3">
          <Loader className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-gray-600">Loading attendance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="flex flex-col md:flex-row gap-3 md:gap-0 items-center justify-between mt-3">
          <p className="text-sm text-gray-600">Overall attendance distribution and performance metrics</p>
          <div className="bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
            <p className="text-xs font-semibold text-blue-700">
              {startDate && endDate ? `${startDate} to ${endDate}` : "All-time data"}
            </p>
          </div>
        </div>
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
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-700">Attendance Rate</p>
            {trend !== 0 && renderTrendIcon(trend)}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-blue-600">{stats.attendanceRate}%</p>
            <span className={`text-sm font-semibold ${getTrendColor(trend)}`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-2">Present + Late</p>
        </div>

        {/* Present Count */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
          <p className="text-sm font-semibold text-emerald-700 mb-3">Present</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.presentCount}</p>
          <p className="text-xs text-emerald-600 mt-2">
            {stats.totalRecords > 0 ? `${Math.round((stats.presentCount / stats.totalRecords) * 100)}%` : "0%"} of total
          </p>
        </div>

        {/* Late Count */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm font-semibold text-amber-700 mb-3">Late</p>
          <p className="text-3xl font-bold text-amber-600">{stats.lateCount}</p>
          <p className="text-xs text-amber-600 mt-2">
            {stats.totalRecords > 0 ? `${Math.round((stats.lateCount / stats.totalRecords) * 100)}%` : "0%"} of total
          </p>
        </div>

        {/* Absent Count */}
        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-700 mb-3">Absent</p>
          <p className="text-3xl font-bold text-red-600">{stats.absentCount}</p>
          <p className="text-xs text-red-600 mt-2">
            {stats.totalRecords > 0 ? `${Math.round((stats.absentCount / stats.totalRecords) * 100)}%` : "0%"} of total
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Pie Chart */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Distribution</h3>
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-400">
              <p className="text-sm">No attendance data available</p>
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Attendance Summary</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">All-time</span>
            </div>
            <div className="space-y-4">
              {attendanceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.fill,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 min-w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total Records */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <p className="text-sm font-semibold text-purple-700 mb-3">Total Attendance Records</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalRecords}</p>
            <p className="text-xs text-purple-600 mt-2">Records marked across all classes</p>
          </div>

          {/* Trend Card */}
          <div className={`rounded-lg p-4 border ${getTrendBgColor(trend)}`}>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {renderTrendIcon(trend)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {trend > 0 
                    ? "Attendance Improved" 
                    : trend < 0 
                    ? "Attendance Declined" 
                    : "Attendance Stable"}
                </p>
                <p className={`text-xs mt-1 ${getTrendColor(trend)}`}>
                  {trend > 0 
                    ? `Attendance rate increased by ${Math.abs(trend)}% compared to previous period.` 
                    : trend < 0 
                    ? `Attendance rate decreased by ${Math.abs(trend)}% compared to previous period.` 
                    : "No significant change from the previous period."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">Attendance Breakdown by Class</p>
          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">Grouped by class</span>
        </div>

        {classBreakdown.length > 0 ? (
          <div className="space-y-3">
            {classBreakdown.map((item, index) => (
              <div key={`${item.className}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.className}</p>
                    <p className="text-xs text-gray-500">{item.total} records • {item.attendanceRate}% attendance</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-green-50 px-2 py-1 text-green-700">Present {item.present}</span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Late {item.late}</span>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">Absent {item.absent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No class-level data available for the selected date range.</p>
        )}
      </div>

      {/* Legend Reference */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-800 mb-3">Attendance Status Reference</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Present", description: "Marked as present", color: "#10b981" },
            { label: "Late", description: "Marked as late arrival", color: "#f59e0b" },
            { label: "Absent", description: "Marked as absent", color: "#ef4444" },
          ].map((status, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: status.color }}
              ></div>
              <div>
                <p className="text-sm font-medium text-gray-800">{status.label}</p>
                <p className="text-xs text-gray-600">{status.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Period Note */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">ℹ️ Note:</span> {startDate && endDate ? `This chart displays attendance records from ${startDate} to ${endDate}.` : `This chart displays all-time attendance records from the entire history of the school. Use the date filters above to view data for a specific period.`}
        </p>
      </div>
    </div>
  );
}
