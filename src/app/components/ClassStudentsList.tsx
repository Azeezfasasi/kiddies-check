"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Users, Loader, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function ClassStudentsList({ classId, schoolId, userId, onStudentClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    if (students.length > 0) return; // Already loaded

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/teacher/students?schoolId=${schoolId}&classId=${classId}`,
        {
          headers: {
            "x-user-id": userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data.students || []);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(err.message);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && students.length === 0) {
      fetchStudents();
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Students ({students.length})
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : students.length === 0 ? (
            <p className="text-sm text-gray-500 py-3 text-center">No students in this class</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {students.map((student) => (
                <button
                  key={student._id}
                  onClick={() => onStudentClick(student._id)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {student.enrollmentNo || "No ID"}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 group-hover:text-blue-600">
                      View Profile →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
