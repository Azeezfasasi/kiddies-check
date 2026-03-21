"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, AlertCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";
import ClassModal from "@/app/components/ClassModal";

export default function AllClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    // Try activeSchoolId first (for admins who switched schools), fall back to schoolId
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !schoolId || !userId) {
      router.push("/login");
      return;
    }

    setActiveSchoolId(schoolId);
    setUserId(userId);
    fetchClasses(schoolId, userId);
  }, [router]);

  const fetchClasses = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/classes?schoolId=${schoolId}`,
        {
          headers: {
            "x-user-id": userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch classes");
      }

      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setShowModal(true);
  };

  const handleEditClass = (classData) => {
    setEditingClass(classData);
    setShowModal(true);
  };

  const handleDeleteClass = async (classId) => {
    try {
      const response = await fetch(
        `/api/teacher/classes/${classId}?schoolId=${activeSchoolId}`,
        {
          method: "DELETE",
          headers: {
            "x-user-id": userId,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete class");
      }

      setClasses(classes.filter((c) => c._id !== classId));
      toast.success("Class deleted successfully");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
  };

  const handleClassSaved = () => {
    setShowModal(false);
    fetchClasses(activeSchoolId, userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 md:gap-0 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Classes Management</h1>
            <p className="text-gray-600 mt-2">Manage and organize your school classes</p>
          </div>
          <button
            onClick={handleAddClass}
            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Class
          </button>
        </div>

        {/* Classes Grid */}
        {classes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No classes yet</h2>
            <p className="text-gray-600 mb-6">Create your first class to get started</p>
            <button
              onClick={handleAddClass}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classData) => (
              <div
                key={classData._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
                  <h3 className="text-xl font-bold">{classData.name}</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {classData.level.charAt(0).toUpperCase() + classData.level.slice(1)} • Section {classData.section}
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-semibold text-gray-800">{classData.numberOfStudents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Class Teacher:</span>
                      <span className="font-semibold text-gray-800">
                        {classData.classTeacher?.firstName} {classData.classTeacher?.lastName || "Unassigned"}
                      </span>
                    </div>
                    {classData.description && (
                      <div className="pt-3 border-t">
                        <p className="text-gray-600 text-sm">{classData.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClass(classData)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(classData._id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <ClassModal
          classData={editingClass}
          schoolId={activeSchoolId}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSave={handleClassSaved}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this class? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClass(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
