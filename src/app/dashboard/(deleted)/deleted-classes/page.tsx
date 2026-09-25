
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/app/dashboard/components/Modal";

export default function DeletedClassesPage() {
  const [classes, setClasses] = useState([]);
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
    fetchDeletedClasses(schoolId, user);
  }, [router]);

  const fetchDeletedClasses = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/classes?schoolId=${schoolId}&isActive=false`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load deleted classes");
      }

      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error("Deleted classes fetch error:", error);
      toast.error("Unable to load deleted classes");
    } finally {
      setLoading(false);
    }
  };

  const restoreClass = async (classId) => {
    try {
      setRestoringId(classId);
      const response = await fetch(`/api/teacher/classes/${classId}?schoolId=${activeSchoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore class");
      }

      toast.success("Class restored successfully");
      fetchDeletedClasses(activeSchoolId, userId);
    } catch (error) {
      console.error("Restore class error:", error);
      toast.error("Unable to restore class");
    } finally {
      setRestoringId(null);
    }
  };

  const promptDeleteClass = (classData) => {
    setConfirmDeleteTarget({ id: classData._id, name: classData.name, type: "class" });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!confirmDeleteTarget) return;

    try {
      setHardDeletingId(confirmDeleteTarget.id);
      const response = await fetch(`/api/teacher/classes/${confirmDeleteTarget.id}?schoolId=${activeSchoolId}&hard=true`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to permanently delete class");
      }

      toast.success("Class permanently deleted");
      setConfirmDeleteTarget(null);
      fetchDeletedClasses(activeSchoolId, userId);
    } catch (error) {
      console.error("Delete class error:", error);
      toast.error("Unable to permanently delete class");
    } finally {
      setHardDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deleted Classes</h1>
            <p className="text-gray-600 mt-2">Restore classes that were soft deleted from your school.</p>
          </div>
          <button
            onClick={() => fetchDeletedClasses(activeSchoolId, userId)}
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
        ) : classes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No deleted classes found</h2>
            <p className="mt-2 text-slate-600">Soft deleted classes will appear here once they are removed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((classData) => (
              <div key={classData._id} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{classData.name}</h2>
                    <p className="text-sm text-slate-600">Level: {classData.level || "n/a"} · Section: {classData.section || "n/a"}</p>
                    <p className="text-sm text-slate-600">Teacher: {classData.classTeacher ? `${classData.classTeacher.firstName} ${classData.classTeacher.lastName}` : "Unassigned"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => restoreClass(classData._id)}
                      disabled={restoringId === classData._id || hardDeletingId === classData._id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {restoringId === classData._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Restore
                    </button>
                    <button
                      onClick={() => promptDeleteClass(classData)}
                      disabled={restoringId === classData._id || hardDeletingId === classData._id}
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {hardDeletingId === classData._id ? (
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
        title="Permanently delete deleted class"
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
            <strong>Warning:</strong> Permanent deletion removes the class from the database completely.
          </div>
        </div>
      </Modal>
    </div>
  );
}