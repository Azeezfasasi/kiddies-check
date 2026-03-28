"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

export default function ClassModal({ classData, schoolId, userId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    level: "primary",
    section: "A",
    numberOfStudents: 0,
    description: "",
    subjects: [],
    classTeacher: "",
  });
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);
  const [staffLoading, setStaffLoading] = useState(true);
  const [availableStaff, setAvailableStaff] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch available subjects
    const fetchSubjects = async () => {
      try {
        const response = await fetch(`/api/teacher/subjects?schoolId=${schoolId}`, {
          headers: {
            "x-user-id": userId,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableSubjects(data.subjects || []);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
      } finally {
        setSubjectsLoading(false);
      }
    };

    // Fetch available staff
    const fetchStaff = async () => {
      try {
        const response = await fetch(`/api/teacher/staff?schoolId=${schoolId}`, {
          headers: {
            "x-user-id": userId,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableStaff(data.staff || []);
        }
      } catch (error) {
        console.error("Error fetching staff:", error);
        toast.error("Failed to load staff");
      } finally {
        setStaffLoading(false);
      }
    };

    if (schoolId && userId) {
      fetchSubjects();
      fetchStaff();
    }
  }, [schoolId, userId]);

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        level: classData.level,
        section: classData.section,
        numberOfStudents: classData.numberOfStudents || 0,
        description: classData.description || "",
        subjects: classData.subjects?.map(s => (typeof s === 'string' ? s : s._id)) || [],
        classTeacher: classData.classTeacher?._id || classData.classTeacher || "",
      });
    }
  }, [classData]);

  const handleChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    
    if (type === "select-multiple") {
      const selectedValues = Array.from(selectedOptions).map(option => option.value);
      setFormData((prev) => ({
        ...prev,
        [name]: selectedValues,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === "numberOfStudents" ? parseInt(value) || 0 : value,
      }));
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData((prev) => {
      const isSelected = prev.subjects.includes(subjectId);
      return {
        ...prev,
        subjects: isSelected
          ? prev.subjects.filter((id) => id !== subjectId)
          : [...prev.subjects, subjectId],
      };
    });
  };

  const removeSubject = (subjectId) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((id) => id !== subjectId),
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSubjectsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Class name is required");
      return;
    }

    setLoading(true);
    try {
      const url = classData
        ? `/api/teacher/classes/${classData._id}?schoolId=${schoolId}`
        : `/api/teacher/classes`;

      const method = classData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          schoolId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save class");
      }

      toast.success(classData ? "Class updated successfully" : "Class created successfully");
      onSave();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-md w-full h-[600px] md:h-[500px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {classData ? "Edit Class" : "Create New Class"}
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Class 1A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Level
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Students
            </label>
            <input
              type="number"
              name="numberOfStudents"
              value={formData.numberOfStudents}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Class Teacher
            </label>
            {staffLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            ) : (
              <select
                name="classTeacher"
                value={formData.classTeacher}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a class teacher</option>
                {availableStaff.length === 0 ? (
                  <option disabled>No staff available</option>
                ) : (
                  availableStaff.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.firstName} {staff.lastName} ({staff.email})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add class description or notes..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subjects
            </label>
            {subjectsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
              </div>
            ) : (
              <div ref={dropdownRef} className="relative">
                {/* Selected Subjects Tags */}
                {formData.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.subjects.map((subjectId) => {
                      const subject = availableSubjects.find((s) => s._id === subjectId);
                      return subject ? (
                        <div
                          key={subjectId}
                          className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {subject.name}
                          <button
                            type="button"
                            onClick={() => removeSubject(subjectId)}
                            className="hover:text-blue-900 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Dropdown Button */}
                <button
                  type="button"
                  onClick={() => setShowSubjectsDropdown(!showSubjectsDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700">
                    {formData.subjects.length > 0
                      ? `${formData.subjects.length} subject(s) selected`
                      : "Select subjects"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      showSubjectsDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {showSubjectsDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                    {availableSubjects.length === 0 ? (
                      <div className="p-3 text-center text-gray-600 text-sm">
                        No subjects available
                      </div>
                    ) : (
                      <div className="max-h-48 overflow-y-auto">
                        {availableSubjects.map((subject) => (
                          <label
                            key={subject._id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={formData.subjects.includes(subject._id)}
                              onChange={() => handleSubjectToggle(subject._id)}
                              className="w-4 h-4 accent-blue-600 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {subject.name}
                              {subject.code && (
                                <span className="text-gray-500 ml-2">({subject.code})</span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
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
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {classData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
