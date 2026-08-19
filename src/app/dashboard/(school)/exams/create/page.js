"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader } from "lucide-react";
import toast from "react-hot-toast";

const emptyOption = () => ({ text: "", isCorrect: false });

const emptyQuestion = () => ({
  text: "",
  type: "single-choice",
  marks: 1,
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
});

const trueFalseOptions = () => [
  { text: "True", isCorrect: true },
  { text: "False", isCorrect: false },
];

export default function CreateExamPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [term, setTerm] = useState("First Term");
  const [academicYear, setAcademicYear] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState([emptyQuestion()]);

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

    const loadClasses = async () => {
      try {
        const res = await fetch(`/api/teacher/classes?schoolId=${storedSchoolId}`, {
          headers: { "x-user-id": storedUserId },
        });
        const data = await res.json();
        setClasses(data.classes || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [router]);

  useEffect(() => {
    if (!classId || !schoolId) {
      setSubjects([]);
      setSubjectId("");
      return;
    }

    const loadSubjects = async () => {
      try {
        const res = await fetch(`/api/teacher/subjects?schoolId=${schoolId}&classId=${classId}`, {
          headers: { "x-user-id": userId },
        });
        const data = await res.json();
        setSubjects(data.subjects || []);
        setSubjectId("");
      } catch (error) {
        console.error(error);
        setSubjects([]);
      }
    };

    loadSubjects();
  }, [classId, schoolId, userId]);

  const updateQuestion = (index, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const changeQuestionType = (index, type) => {
    updateQuestion(index, {
      type,
      options: type === "true-false" ? trueFalseOptions() : [emptyOption(), emptyOption()],
    });
  };

  const updateOption = (qIndex, oIndex, text) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex ? q : { ...q, options: q.options.map((o, oi) => (oi === oIndex ? { ...o, text } : o)) }
      )
    );
  };

  const setCorrectOption = (qIndex, oIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qIndex ? q : { ...q, options: q.options.map((o, oi) => ({ ...o, isCorrect: oi === oIndex })) }
      )
    );
  };

  const addOption = (qIndex) => {
    setQuestions((prev) => prev.map((q, i) => (i !== qIndex ? q : { ...q, options: [...q.options, emptyOption()] })));
  };

  const removeOption = (qIndex, oIndex) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i !== qIndex || q.options.length <= 2 ? q : { ...q, options: q.options.filter((_, oi) => oi !== oIndex) }))
    );
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index) => setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!classId || !subjectId || !title.trim() || !term.trim() || !academicYear.trim() || !durationMinutes) {
      toast.error("Please fill in class, subject, title, term, academic year and duration");
      return;
    }
    for (const [index, q] of questions.entries()) {
      if (!q.text.trim()) {
        toast.error(`Question ${index + 1} needs text`);
        return;
      }
      if (q.options.filter((o) => o.isCorrect).length !== 1) {
        toast.error(`Question ${index + 1} needs exactly one correct option`);
        return;
      }
      if (q.options.some((o) => !o.text.trim())) {
        toast.error(`Question ${index + 1} has a blank option`);
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          schoolId,
          classId,
          subjectId,
          title,
          term,
          academicYear,
          durationMinutes: Number(durationMinutes),
          instructions,
          questions,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Failed to create exam");
      toast.success("Exam saved as draft");
      router.push("/dashboard/exams");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-6 mx-auto md:mx-0">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl p-2 md:p-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Create CBT Exam</h1>
          <p className="text-sm text-gray-600">Build an objective exam. It's saved as a draft until you publish it.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!classId} className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-100">
                <option value="">{classId ? "Select subject" : "Select a class first"}</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Exam Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mathematics Mid-Term CBT" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Term</label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Academic Year</label>
              <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2026/2027" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Duration (minutes)</label>
              <input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Instructions (optional)</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} placeholder="Shown to students before they start" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Questions</h2>
              <button type="button" onClick={addQuestion} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100">
                <Plus className="w-4 h-4" /> Add question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="mt-2 shrink-0 text-sm font-semibold text-gray-500">Q{qIndex + 1}</span>
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                    placeholder="Question text"
                    rows={2}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
                  />
                  <button type="button" onClick={() => removeQuestion(qIndex)} disabled={questions.length <= 1} className="mt-2 shrink-0 text-red-500 hover:text-red-700 disabled:opacity-30">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-3 pl-8">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Type
                    <select value={q.type} onChange={(e) => changeQuestionType(qIndex, e.target.value)} className="rounded-lg border border-gray-300 px-2 py-1">
                      <option value="single-choice">Single choice</option>
                      <option value="true-false">True / False</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Marks
                    <input type="number" min="1" value={q.marks} onChange={(e) => updateQuestion(qIndex, { marks: e.target.value })} className="w-16 rounded-lg border border-gray-300 px-2 py-1" />
                  </label>
                </div>

                <div className="space-y-2 pl-8">
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        checked={option.isCorrect}
                        onChange={() => setCorrectOption(qIndex, oIndex)}
                        title="Mark as correct answer"
                      />
                      <input
                        value={option.text}
                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                        disabled={q.type === "true-false"}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 disabled:bg-gray-100"
                      />
                      {q.type === "single-choice" && (
                        <button type="button" onClick={() => removeOption(qIndex, oIndex)} disabled={q.options.length <= 2} className="text-red-500 hover:text-red-700 disabled:opacity-30">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.type === "single-choice" && (
                    <button type="button" onClick={() => addOption(qIndex)} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? "Saving..." : "Save as draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
