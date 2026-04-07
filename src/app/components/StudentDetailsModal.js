"use client";

import { useState, useEffect } from "react";
import { X, Loader, User as UserIcon, Mail, Phone, Calendar, Award } from "lucide-react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function StudentDetailsModal({ studentId, schoolId, userId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [stats, setStats] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await fetch(
          `/api/teacher/students/${studentId}/stats?schoolId=${schoolId}`,
          {
            headers: {
              "x-user-id": userId,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch student details");
        }

        const data = await response.json();
        setStudentData(data.student);
        setPerformance(data.performance);
        setStats(data.stats);
        setAttendance(data.attendance);
        setGradeDistribution(data.gradeDistribution);
      } catch (error) {
        console.error("Error fetching student details:", error);
        toast.error("Failed to load student details");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (studentId && schoolId && userId) {
      fetchStudentDetails();
    }
  }, [studentId, schoolId, userId, onClose]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">Student Profile</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Student Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center">
                  {studentData.photo ? (
                    <img
                      src={studentData.photo}
                      alt={`${studentData.firstName} ${studentData.lastName}`}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-12 h-12 text-blue-600" />
                  )}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="text-lg font-bold text-gray-800">
                    {studentData.firstName} {studentData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enrollment No.</p>
                  <p className="text-lg font-bold text-gray-800">{studentData.enrollmentNo || "N/A"}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm text-gray-800">{studentData.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm text-gray-800">{studentData.phone || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">School</p>
                  <p className="text-lg font-bold text-gray-800">{studentData.school?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Class</p>
                  <p className="text-lg font-bold text-gray-800">
                    {studentData.class?.name}
                    {studentData.class?.section && ` - ${studentData.class.section}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="text-lg font-bold text-gray-800">{calculateAge(studentData.dateOfBirth) || "N/A"} years</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-700 font-medium">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.average}%</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-700 font-medium">Highest Score</p>
                <p className="text-2xl font-bold text-blue-600">{stats.highest}%</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-700 font-medium">Lowest Score</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowest}%</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-700 font-medium">Subjects</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSubjects}</p>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Performance Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Subject Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Grade Distribution Pie Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Grade Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance Chart */}
          {/* {attendance.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )} */}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
