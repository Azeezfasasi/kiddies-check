
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/app/dashboard/components/Modal";

export default function DeletedStudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [restoringId, setRestoringId] = useState(null);
  const [hardDeletingId, setHardDeletingId] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const user = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !schoolId || !user) {
      router.push("/login");
      return;
    }

    setActiveSchoolId(schoolId);
    setUserId(user);
    fetchDeletedStudents(schoolId, user);
  }, [router]);

  const fetchDeletedStudents = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/students?schoolId=${schoolId}&isActive=false`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load deleted students");
      }

      const data = await response.json();
      setStudents(data.data || []);
    } catch (error) {
      console.error("Deleted students fetch error:", error);
      toast.error("Unable to load deleted students");
    } finally {
      setLoading(false);
    }
  };

  const restoreStudent = async (studentId) => {
    try {
      setRestoringId(studentId);
      const response = await fetch(`/api/teacher/students/${studentId}?schoolId=${activeSchoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore student");
      }

      toast.success("Student restored successfully");
      fetchDeletedStudents(activeSchoolId, userId);
    } catch (error) {
      console.error("Restore student error:", error);
      toast.error("Unable to restore student");
    } finally {
      setRestoringId(null);
    }
  };

  const promptDeleteStudent = (studentData) => {
    setConfirmDeleteTarget({ id: studentData._id, name: studentData.fullName || studentData.name, type: "student" });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!confirmDeleteTarget) return;

    try {
      setHardDeletingId(confirmDeleteTarget.id);
      const response = await fetch(`/api/teacher/students/${confirmDeleteTarget.id}?schoolId=${activeSchoolId}&hard=true`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to permanently delete student");
      }

      toast.success("Student permanently deleted");
      setConfirmDeleteTarget(null);
      fetchDeletedStudents(activeSchoolId, userId);
    } catch (error) {
      console.error("Delete student error:", error);
      toast.error("Unable to permanently delete student");
    } finally {
      setHardDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deleted Students</h1>
            <p className="text-gray-600 mt-2">Restore students who were soft deleted from your school.</p>
          </div>
          <button
            onClick={() => fetchDeletedStudents(activeSchoolId, userId)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No deleted students found</h2>
            <p className="mt-2 text-slate-600">Soft deleted students will appear here once they are removed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student._id} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{student.firstName} {student.lastName}</h2>
                    <p className="text-sm text-slate-600">Enrollment: {student.enrollmentNo || "N/A"}</p>
                    <p className="text-sm text-slate-600">Class: {student.class?.name || "Unassigned"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => restoreStudent(student._id)}
                      disabled={restoringId === student._id || hardDeletingId === student._id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {restoringId === student._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Restore
                    </button>
                    <button
                      onClick={() => promptDeleteStudent(student)}
                      disabled={restoringId === student._id || hardDeletingId === student._id}
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {hardDeletingId === student._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Delete permanently
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!confirmDeleteTarget}
        title="Permanently delete deleted student"
        onClose={() => setConfirmDeleteTarget(null)}
        onConfirm={handleConfirmPermanentDelete}
        confirmText="Delete permanently"
        cancelText="Cancel"
        isLoading={hardDeletingId === confirmDeleteTarget?.id}
        isDangerous={true}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
            Deleted
          </div>
          <p className="text-sm text-gray-700">
            You are about to permanently delete <strong>{confirmDeleteTarget?.name}</strong>. This action cannot be undone.
          </p>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Warning:</strong> Permanent deletion removes the student from the database completely.
          </div>
        </div>
      </Modal>
    </div>
  );
}