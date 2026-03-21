"use client";

import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function AssessmentModal({
  assessmentData,
  schoolId,
  userId,
  classes,
  students,
  subjects,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    classId: "",
    studentId: "",
    subjectId: "",
    week: 1,
    year: new Date().getFullYear(),
    date: new Date().toISOString().split("T")[0],
    score: 0,
    maxScore: 100,
    gradeLevel: "",
    remarks: "",
    assessmentType: "assignment",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assessmentData) {
      setFormData({
        classId: assessmentData.class?._id || "",
        studentId: assessmentData.student?._id || "",
        subjectId: assessmentData.subject?._id || "",
        week: assessmentData.week,
        year: assessmentData.year,
        date: assessmentData.date.split("T")[0],
        score: assessmentData.score,
        maxScore: assessmentData.maxScore || 100,
        gradeLevel: assessmentData.gradeLevel || "",
        remarks: assessmentData.remarks || "",
        assessmentType: assessmentData.assessmentType || "assignment",
      });
    }
  }, [assessmentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["week", "year", "score", "maxScore"].includes(name) ? parseInt(value) || 0 : value,
    }));
  };

  // Calculate grade based on score
  const calculateGrade = (score) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.classId || !formData.studentId || !formData.subjectId) {
      toast.error("Class, student, and subject are required");
      return;
    }

    if (formData.score < 0 || formData.score > formData.maxScore) {
      toast.error(`Score must be between 0 and ${formData.maxScore}`);
      return;
    }

    setLoading(true);
    try {
      const url = assessmentData
        ? `/api/teacher/assessments/${assessmentData._id}?schoolId=${schoolId}`
        : `/api/teacher/assessments`;

      const method = assessmentData ? "PUT" : "POST";

      // Auto-calculate grade from score
      const autoGrade = calculateGrade(formData.score);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          schoolId,
          ...formData,
          gradeLevel: autoGrade,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save assessment");
      }

      toast.success(
        assessmentData ? "Assessment updated successfully" : "Assessment recorded successfully"
      );
      onSave();
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter students by selected class
  const filteredStudents = formData.classId
    ? students.filter((s) => s.class?._id === formData.classId)
    : students;

  // Calculate grade based on score
  const getGrade = (score) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            {assessmentData ? "Edit Assessment" : "Record Assessment"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Class *</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student *</label>
            <select
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a student</option>
              {filteredStudents.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.firstName} {student.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject *</label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Week</label>
              <input
                type="number"
                name="week"
                value={formData.week}
                onChange={handleChange}
                min="1"
                max="52"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="2020"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Score ({formData.score} / {formData.maxScore})
            </label>
            <input
              type="number"
              name="score"
              value={formData.score}
              onChange={handleChange}
              min="0"
              max={formData.maxScore}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600"
                  style={{ width: `${(formData.score / formData.maxScore) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-purple-600">
                {getGrade(formData.score)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
            <select
              name="assessmentType"
              value={formData.assessmentType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="project">Project</option>
              <option value="participation">Participation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Add teacher remarks..."
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {assessmentData ? "Update" : "Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
