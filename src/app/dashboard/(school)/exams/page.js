"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader, Copy, CheckCircle2, XCircle, BarChart3, Trash2, Eye, Search } from "lucide-react";
import toast from "react-hot-toast";

const statusStyles = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  closed: "bg-amber-100 text-amber-700",
};

export default function ExamsPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [exams, setExams] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [busyId, setBusyId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadExams = useCallback(async (school, user, status, classId, search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ schoolId: school });
      if (status) params.set("status", status);
      if (classId) params.set("classId", classId);
      if (search) params.set("search", search);
      const res = await fetch(`/api/exams?${params.toString()}`, { headers: { "x-user-id": user } });
      const data = await res.json();
      if (data.success) setExams(data.exams || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedSchoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    if (!token || !storedUserId || !storedSchoolId) {
      router.push("/login");
      return;
    }

    setSchoolId(storedSchoolId);
    setUserId(storedUserId);

    fetch(`/api/teacher/classes?schoolId=${storedSchoolId}`, { headers: { "x-user-id": storedUserId } })
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []))
      .catch((error) => console.error(error));
  }, [router]);

  useEffect(() => {
    if (!schoolId || !userId) return;
    loadExams(schoolId, userId, statusFilter, classFilter, searchQuery);
  }, [schoolId, userId, statusFilter, classFilter, searchQuery, loadExams]);

  // Reset to page 1 whenever the visible set of exams changes shape
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, classFilter, searchQuery]);

  const handlePublish = async (exam) => {
    setBusyId(exam._id);
    try {
      const res = await fetch(`/api/exams/${exam._id}/publish`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to publish exam");
      toast.success(`Published — access code ${data.exam.accessCode}`);
      loadExams(schoolId, userId, statusFilter, classFilter, searchQuery);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId("");
    }
  };

  const handleClose = async (exam) => {
    if (!window.confirm("Close this exam? Students will no longer be able to join.")) return;
    setBusyId(exam._id);
    try {
      const res = await fetch(`/api/exams/${exam._id}/close`, { method: "PUT", headers: { "x-user-id": userId } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to close exam");
      toast.success("Exam closed");
      loadExams(schoolId, userId, statusFilter, classFilter, searchQuery);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (exam) => {
    if (!window.confirm("Delete this draft exam?")) return;
    setBusyId(exam._id);
    try {
      const res = await fetch(`/api/exams/${exam._id}`, { method: "DELETE", headers: { "x-user-id": userId } });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to delete exam");
      toast.success("Exam deleted");
      loadExams(schoolId, userId, statusFilter, classFilter, searchQuery);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId("");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Access code copied");
  };

  const totalPages = Math.max(1, Math.ceil(exams.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExams = exams.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">CBT Exams</h1>
            <p className="text-sm text-gray-600">Create, publish and track objective exams.</p>
          </div>
          <Link href="/dashboard/exams/create" className="inline-block w-full rounded bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 sm:w-auto">
            Create Exam
          </Link>
        </div>

        <div className="mb-4 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam title"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">
            {statusFilter || classFilter || searchQuery ? "No exams match your filters." : "No exams yet."}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedExams.map((exam) => (
                <div key={exam._id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[exam.status]}`}>{exam.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {exam.class?.name} · {exam.subject?.name} · {exam.term} {exam.academicYear} · {exam.durationMinutes} min · {exam.totalMarks} marks
                      </p>
                      {exam.status === "published" && exam.accessCode && (
                        <button onClick={() => copyCode(exam.accessCode)} className="mt-2 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
                          Access code: <span className="tracking-widest">{exam.accessCode}</span> <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link href={`/dashboard/exams/${exam._id}/preview`} className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                        <Eye className="w-4 h-4" /> View
                      </Link>
                      {exam.status === "draft" && (
                        <>
                          <button onClick={() => handlePublish(exam)} disabled={busyId === exam._id} className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60">
                            <CheckCircle2 className="w-4 h-4" /> Publish
                          </button>
                          <button onClick={() => handleDelete(exam)} disabled={busyId === exam._id} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                      {exam.status === "published" && (
                        <button onClick={() => handleClose(exam)} disabled={busyId === exam._id} className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60">
                          <XCircle className="w-4 h-4" /> Close
                        </button>
                      )}
                      {exam.status !== "draft" && (
                        <Link href={`/dashboard/exams/${exam._id}/results`} className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
                          <BarChart3 className="w-4 h-4" /> Results
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {exams.length > 0 && (
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-4 md:justify-center">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                            currentPage === page ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}

                <div className="text-center text-sm text-gray-600 md:text-right">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, exams.length)} of {exams.length} exams
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
