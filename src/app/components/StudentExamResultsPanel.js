"use client";

import { useState, useEffect } from "react";
import { X, Loader, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

export default function StudentExamResultsPanel({ studentId, studentName, schoolId, userId, onClose }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/parent/exam-results?schoolId=${schoolId}`, {
          headers: { "x-user-id": userId },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load exam results");
        setResults((data.results || []).filter((r) => r.student?._id === studentId));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load exam results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [schoolId, studentId, userId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">{studentName}'s Exam Results</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <GraduationCap className="w-14 h-14 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No graded CBT exam results yet for {studentName}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div key={r._id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{r.exam?.title || "Exam"}</p>
                      <p className="text-sm text-gray-500">
                        {r.exam?.subject?.name} · {r.exam?.term} {r.exam?.academicYear}
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                      {r.score} / {r.maxScore}
                    </span>
                  </div>
                  {r.submittedAt && (
                    <p className="mt-2 text-xs text-gray-400">Submitted {new Date(r.submittedAt).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
