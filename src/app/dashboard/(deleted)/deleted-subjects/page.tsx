
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/app/dashboard/components/Modal";

export default function DeletedSubjectsPage() {
  const [subjects, setSubjects] = useState([]);
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
    fetchDeletedSubjects(schoolId, user);
  }, [router]);

  const fetchDeletedSubjects = async (schoolId, userId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teacher/subjects?schoolId=${schoolId}&isActive=false`, {
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load deleted subjects");
      }

      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Deleted subjects fetch error:", error);
      toast.error("Unable to load deleted subjects");
    } finally {
      setLoading(false);
    }
  };

  const restoreSubject = async (subjectId) => {
    try {
      setRestoringId(subjectId);
      const response = await fetch(`/api/teacher/subjects/${subjectId}?schoolId=${activeSchoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore subject");
      }

      toast.success("Subject restored successfully");
      fetchDeletedSubjects(activeSchoolId, userId);
    } catch (error) {
      console.error("Restore subject error:", error);
      toast.error("Unable to restore subject");
    } finally {
      setRestoringId(null);
    }
  };

  const promptDeleteSubject = (subjectData) => {
    setConfirmDeleteTarget({ id: subjectData._id, name: subjectData.name, type: "subject" });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!confirmDeleteTarget) return;

    try {
      setHardDeletingId(confirmDeleteTarget.id);
      const response = await fetch(`/api/teacher/subjects/${confirmDeleteTarget.id}?schoolId=${activeSchoolId}&hard=true`, {
        method: "DELETE",
        headers: {
          "x-user-id": userId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to permanently delete subject");
      }

      toast.success("Subject permanently deleted");
      setConfirmDeleteTarget(null);
      fetchDeletedSubjects(activeSchoolId, userId);
    } catch (error) {
      console.error("Delete subject error:", error);
      toast.error("Unable to permanently delete subject");
    } finally {
      setHardDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deleted Subjects</h1>
            <p className="text-gray-600 mt-2">Restore subjects that were soft deleted from your school.</p>
          </div>
          <button
            onClick={() => fetchDeletedSubjects(activeSchoolId, userId)}
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
        ) : subjects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No deleted subjects found</h2>
            <p className="mt-2 text-slate-600">Soft deleted subjects will appear here once they are removed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject._id} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{subject.name}</h2>
                    <p className="text-sm text-slate-600">Code: {subject.code || "N/A"}</p>
                    <p className="text-sm text-slate-600">Teacher: {subject.teacher ? `${subject.teacher.firstName} ${subject.teacher.lastName}` : "Unassigned"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => restoreSubject(subject._id)}
                      disabled={restoringId === subject._id || hardDeletingId === subject._id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {restoringId === subject._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Restore
                    </button>
                    <button
                      onClick={() => promptDeleteSubject(subject)}
                      disabled={restoringId === subject._id || hardDeletingId === subject._id}
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {hardDeletingId === subject._id ? (
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
        title="Permanently delete deleted subject"
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
            <strong>Warning:</strong> Permanent deletion removes the subject from the database completely.
          </div>
        </div>
      </Modal>
    </div>
  );
}