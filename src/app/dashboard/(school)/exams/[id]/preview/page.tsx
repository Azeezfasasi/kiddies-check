"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader, ArrowLeft, CheckCircle2 } from "lucide-react";

const statusStyles = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-green-100 text-green-700",
  closed: "bg-amber-100 text-amber-700",
};

export default function ExamPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!token || !userId) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/exams/${id}`, { headers: { "x-user-id": userId } });
        const data = await res.json();
        if (data.success) {
          setExam(data.exam);
          setQuestions(data.questions || []);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return <div className="p-6 text-gray-600">Exam not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => router.push("/dashboard/exams")} className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to exams
        </button>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusStyles[exam.status]}`}>{exam.status}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {exam.class?.name} · {exam.subject?.name} · {exam.term} {exam.academicYear} · {exam.durationMinutes} min · {exam.totalMarks} marks
          </p>
          {exam.instructions && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{exam.instructions}</div>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="mb-3 font-semibold text-gray-900">
                {index + 1}. {q.text} <span className="ml-1 text-xs font-normal text-gray-400">({q.marks} mark{q.marks === 1 ? "" : "s"})</span>
              </p>
              <div className="space-y-2">
                {q.options.map((option) => (
                  <div
                    key={option._id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      option.isCorrect ? "border-green-300 bg-green-50 font-medium text-green-800" : "border-gray-200 text-gray-700"
                    }`}
                  >
                    {option.isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                    {option.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
