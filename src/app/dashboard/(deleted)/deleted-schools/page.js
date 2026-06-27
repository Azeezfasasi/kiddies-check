
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/app/dashboard/components/Modal";

export default function DeletedSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringSchoolId, setRestoringSchoolId] = useState(null);
  const [hardDeletingId, setHardDeletingId] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      router.push("/login");
      return;
    }

    fetchDeletedSchools(token);
  }, [router]);

  const fetchDeletedSchools = async (token) => {
    try {
      setLoading(true);
      const response = await fetch("/api/schools?isActive=false", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load deleted schools");
      }

      const data = await response.json();
      setSchools(data.schools || []);
    } catch (error) {
      console.error("Deleted schools fetch error:", error);
      toast.error("Unable to load deleted schools");
    } finally {
      setLoading(false);
    }
  };

  const restoreSchool = async (schoolId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setRestoringSchoolId(schoolId);
      const response = await fetch(`/api/schools/${schoolId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore school");
      }

      toast.success("School restored successfully");
      fetchDeletedSchools(token);
    } catch (error) {
      console.error("Restore school error:", error);
      toast.error("Unable to restore school");
    } finally {
      setRestoringSchoolId(null);
    }
  };

  const promptDeleteSchool = (school) => {
    setConfirmDeleteTarget({ id: school._id, name: school.name, type: "school" });
  };

  const handleConfirmPermanentDelete = async () => {
    if (!confirmDeleteTarget) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setHardDeletingId(confirmDeleteTarget.id);
      const response = await fetch(`/api/schools/${confirmDeleteTarget.id}?hard=true`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to permanently delete school");
      }

      toast.success("School permanently deleted");
      setConfirmDeleteTarget(null);
      fetchDeletedSchools(token);
    } catch (error) {
      console.error("Delete school error:", error);
      toast.error("Unable to permanently delete school");
    } finally {
      setHardDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deleted Schools</h1>
            <p className="text-gray-600 mt-2">Manage schools that have been soft deleted and restore them when needed.</p>
          </div>
          <button
            onClick={() => fetchDeletedSchools(localStorage.getItem("token"))}
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
        ) : schools.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-xl font-semibold text-slate-900">No deleted schools found</h2>
            <p className="mt-2 text-slate-600">Deleted schools will appear here once they are soft deleted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schools.map((school) => (
              <div key={school._id} className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{school.name}</h2>
                    <p className="text-sm text-slate-500">{school.email}</p>
                    <p className="mt-1 text-sm text-slate-600">{school.location || "No location provided"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => restoreSchool(school._id)}
                      disabled={restoringSchoolId === school._id || hardDeletingId === school._id}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {restoringSchoolId === school._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Restore
                    </button>
                    <button
                      onClick={() => promptDeleteSchool(school)}
                      disabled={restoringSchoolId === school._id || hardDeletingId === school._id}
                      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {hardDeletingId === school._id ? (
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
        title="Permanently delete deleted school"
        onClose={() => setConfirmDeleteTarget(null)}
        onConfirm={handleConfirmPermanentDelete}
        confirmText="Delete permanently"
        cancelText="Cancel"
        isLoading={hardDeletingId === confirmDeleteTarget?.id}
        isDangerous={true}
      >
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700">
            <span>Deleted</span>
          </div>
          <p className="text-sm text-gray-700">
            You are about to permanently delete <strong>{confirmDeleteTarget?.name}</strong>. This action cannot be undone.
          </p>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <strong>Warning:</strong> Permanent deletion removes the school from the database completely.
          </div>
        </div>
      </Modal>
    </div>
  );
}