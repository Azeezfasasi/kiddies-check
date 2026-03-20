"use client";

import { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function SubjectModal({ subjectData, schoolId, userId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    creditHours: 0,
    assessmentType: "formative",
    curriculum: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subjectData) {
      setFormData({
        name: subjectData.name,
        code: subjectData.code || "",
        description: subjectData.description || "",
        creditHours: subjectData.creditHours || 0,
        assessmentType: subjectData.assessmentType || "formative",
        curriculum: subjectData.curriculum || "",
      });
    }
  }, [subjectData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "creditHours" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Subject name is required");
      return;
    }

    setLoading(true);
    try {
      const url = subjectData
        ? `/api/teacher/subjects/${subjectData._id}?schoolId=${schoolId}`
        : `/api/teacher/subjects`;

      const method = subjectData ? "PUT" : "POST";

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
        throw new Error(data.error || "Failed to save subject");
      }

      toast.success(subjectData ? "Subject updated successfully" : "Subject created successfully");
      onSave();
    } catch (error) {
      console.error("Error saving subject:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {subjectData ? "Edit Subject" : "Create New Subject"}
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
              Subject Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Mathematics"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Subject Code
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., MATH-101"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Credit Hours
              </label>
              <input
                type="number"
                name="creditHours"
                value={formData.creditHours}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Assessment Type
            </label>
            <select
              name="assessmentType"
              value={formData.assessmentType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="formative">Formative</option>
              <option value="summative">Summative</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Subject description..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Curriculum
            </label>
            <input
              type="text"
              name="curriculum"
              value={formData.curriculum}
              onChange={handleChange}
              placeholder="e.g., National Curriculum"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {subjectData ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
