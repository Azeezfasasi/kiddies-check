"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader, ArrowLeft, ChevronDown, Check, X as XIcon } from "lucide-react";

const statusStyles = {
  "in-progress": "bg-blue-100 text-blue-700",
  submitted: "bg-amber-100 text-amber-700",
  graded: "bg-green-100 text-green-700",
};

export default function ExamResultsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    if (!token || !userId) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/exams/${id}/results`, { headers: { "x-user-id": userId } });
        const data = await res.json();
        if (data.success) {
          setExam(data.exam);
          setAttempts(data.attempts || []);
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

  const averageScore = attempts.length
    ? Math.round((attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length) * 10) / 10
    : 0;

  const answerFor = (attempt, questionId) =>
    attempt.answers?.find((ans) => ans.question === questionId || ans.question?.toString?.() === questionId)?.selectedOptionId || null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <button onClick={() => router.push("/dashboard/exams")} className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to exams
        </button>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h1 className="text-xl font-semibold text-gray-900">{exam.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {exam.class?.name} · {exam.subject?.name} · {exam.term} {exam.academicYear} · {exam.totalMarks} marks
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
              <p className="text-xs text-gray-500">Attempts</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{averageScore}</p>
              <p className="text-xs text-gray-500">Average score</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-2xl font-bold text-gray-900">{exam.accessCode || "—"}</p>
              <p className="text-xs text-gray-500">Access code</p>
            </div>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">No students have attempted this exam yet.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attempts.map((a) => {
                  const isExpanded = expandedId === a._id;
                  return (
                    <React.Fragment key={a._id}>
                      <tr>
                        <td className="px-4 py-3">{a.student ? `${a.student.firstName} ${a.student.lastName}` : "—"}</td>
                        <td className="px-4 py-3 font-semibold">{a.score ?? "—"} / {a.maxScore}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[a.status]}`}>
                            {a.status}{a.autoSubmitted ? " (auto)" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}</td>
                        <td className="px-4 py-3 text-right">
                          {a.status !== "in-progress" && (
                            <button
                              onClick={() => setExpandedId(isExpanded ? "" : a._id)}
                              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {isExpanded ? "Hide answers" : "View answers"}
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 px-4 py-4">
                            <div className="space-y-3">
                              {questions.map((q, index) => {
                                const selectedOptionId = answerFor(a, q._id);
                                const correctOption = q.options.find((o) => o.isCorrect);
                                const gotItRight = selectedOptionId && correctOption && selectedOptionId === correctOption._id;
                                return (
                                  <div key={q._id} className="rounded-lg border border-gray-200 bg-white p-3">
                                    <p className="mb-2 flex items-start gap-2 text-sm font-medium text-gray-900">
                                      {gotItRight ? (
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                                      ) : (
                                        <XIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                                      )}
                                      <span>{index + 1}. {q.text}</span>
                                    </p>
                                    <div className="ml-6 space-y-1">
                                      {q.options.map((option) => {
                                        const isSelected = option._id === selectedOptionId;
                                        const isCorrect = option.isCorrect;
                                        return (
                                          <div
                                            key={option._id}
                                            className={`rounded px-2 py-1 text-sm ${
                                              isCorrect
                                                ? "bg-green-50 font-medium text-green-800"
                                                : isSelected
                                                ? "bg-red-50 font-medium text-red-800"
                                                : "text-gray-600"
                                            }`}
                                          >
                                            {option.text}
                                            {isSelected && <span className="ml-2 text-xs italic">(student's answer)</span>}
                                            {isCorrect && !isSelected && <span className="ml-2 text-xs italic">(correct answer)</span>}
                                          </div>
                                        );
                                      })}
                                      {!selectedOptionId && <p className="text-xs italic text-gray-400">No answer given</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
