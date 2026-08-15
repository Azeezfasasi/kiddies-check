"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader, CheckCircle2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const SESSION_KEY = "cbtAttemptSession";

function formatTime(totalSeconds) {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function CbtExamPage() {
  const [stage, setStage] = useState("loading"); // loading | code | roster | exam | result
  const [code, setCode] = useState("");
  const [examId, setExamId] = useState("");
  const [examMeta, setExamMeta] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  const [token, setToken] = useState("");
  const [attemptId, setAttemptId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const submittingRef = useRef(false);

  // On load, offer to resume an in-progress attempt saved in this browser.
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) {
      setStage("code");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      const deadline = new Date(parsed.deadline).getTime();
      const remaining = Math.floor((deadline - Date.now()) / 1000);
      if (remaining <= 0) {
        sessionStorage.removeItem(SESSION_KEY);
        setStage("code");
        return;
      }
      setToken(parsed.token);
      setAttemptId(parsed.attemptId);
      setQuestions(parsed.questions);
      setAnswers(parsed.answers || {});
      setStudentName(parsed.studentName);
      setExamMeta(parsed.exam);
      setSecondsLeft(remaining);
      setStage("exam");
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      setStage("code");
    }
  }, []);

  const persistSession = useCallback((data) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  }, []);

  const handleLookupCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/exams/by-code?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to find that exam");
      setExamId(data.examId);
      setExamMeta(data.exam);
      setStudents(data.students || []);
      setStage("roster");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleJoin = async () => {
    if (!selectedStudentId) {
      toast.error("Select your name first");
      return;
    }
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/exams/${examId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, accessCode: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Unable to join exam");

      const deadline = new Date(Date.now() + Math.max(60, data.durationMinutes * 60) * 1000);
      const initialAnswers = { ...data.previousAnswers };

      setToken(data.token);
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setAnswers(initialAnswers);
      setStudentName(data.student.name);
      setExamMeta(data.exam);
      setSecondsLeft(data.durationMinutes * 60);
      persistSession({
        token: data.token,
        attemptId: data.attemptId,
        questions: data.questions,
        answers: initialAnswers,
        studentName: data.student.name,
        exam: data.exam,
        deadline: deadline.toISOString(),
      });
      setStage("exam");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const saveAnswer = useCallback(
    (questionId, selectedOptionId) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: selectedOptionId };
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          persistSession({ ...parsed, answers: next });
        }
        return next;
      });
      fetch(`/api/exam-attempts/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId, selectedOptionId }),
      }).catch(() => {});
    },
    [attemptId, token, persistSession]
  );

  const handleSubmit = useCallback(
    async (autoSubmitted = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoadingAction(true);
      try {
        const res = await fetch(`/api/exam-attempts/${attemptId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ autoSubmitted }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Unable to submit exam");
        setResult(data);
        sessionStorage.removeItem(SESSION_KEY);
        setStage("result");
        if (autoSubmitted) toast("Time's up — your exam was submitted automatically", { icon: "⏰" });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoadingAction(false);
        submittingRef.current = false;
      }
    },
    [attemptId, token]
  );

  // Countdown timer
  useEffect(() => {
    if (stage !== "exam") return undefined;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [stage, handleSubmit]);

  const startOver = () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  const answeredCount = Object.values(answers).filter(Boolean).length;

  if (stage === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        {stage === "code" && (
          <form onSubmit={handleLookupCode} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Enter Exam Code</h1>
            <p className="mb-6 text-sm text-gray-600">Ask your teacher for today's access code.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7M2QX"
              maxLength={8}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] uppercase"
              autoFocus
            />
            <button type="submit" disabled={loadingAction} className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {loadingAction ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {stage === "roster" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="mb-1 text-2xl font-bold text-gray-900">{examMeta?.title}</h1>
            <p className="mb-6 text-sm text-gray-600">Find and select your name below.</p>
            <div className="mb-5 max-h-72 space-y-2 overflow-y-auto">
              {students.map((s) => (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => setSelectedStudentId(s._id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                    selectedStudentId === s._id ? "border-blue-500 bg-blue-50 font-semibold text-blue-800" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {s.firstName} {s.lastName}
                </button>
              ))}
            </div>
            <button onClick={handleJoin} disabled={loadingAction || !selectedStudentId} className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {loadingAction ? "Starting..." : "Start Exam"}
            </button>
          </div>
        )}

        {stage === "exam" && (
          <div>
            <div className="sticky top-0 z-10 mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="font-semibold text-gray-900">{examMeta?.title}</p>
                <p className="text-xs text-gray-500">{studentName} · {answeredCount}/{questions.length} answered</p>
              </div>
              <div className={`rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${secondsLeft < 60 ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                {formatTime(secondsLeft)}
              </div>
            </div>

            {examMeta?.instructions && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{examMeta.instructions}</div>
            )}

            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={q._id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 font-semibold text-gray-900">
                    {index + 1}. {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <label
                        key={option._id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                          answers[q._id] === option._id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={q._id}
                          checked={answers[q._id] === option._id}
                          onChange={() => saveAnswer(q._id, option._id)}
                        />
                        <span className="text-sm text-gray-800">{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubmit(false)}
              disabled={loadingAction}
              className="mt-6 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loadingAction ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        )}

        {stage === "result" && result && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-600" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Exam Submitted</h1>
            <p className="text-gray-600">Well done, {studentName}! Your exam has been recorded.</p>
            {!result.alreadySubmitted && (
              <p className="mt-4 text-lg font-semibold text-gray-800">
                Score: {result.score} / {result.maxScore}
              </p>
            )}
            <button onClick={startOver} className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" /> Take another exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
