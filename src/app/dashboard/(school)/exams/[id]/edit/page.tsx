"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader } from "lucide-react";
import toast from "react-hot-toast";
import ExamForm, { type ExamFormValues } from "../../components/ExamForm";

export default function EditExamPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [initialValues, setInitialValues] = useState<ExamFormValues | null>(null);
  const [status, setStatus] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }

    const loadExam = async () => {
      try {
        const res = await fetch(`/api/exams/${id}`, { headers: { "x-user-id": userId } });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load exam");

        const { exam, questions } = data;
        setStatus(exam.status);
        setAttemptCount(data.attemptCount || 0);
        setInitialValues({
          classId: exam.class?._id || "",
          subjectId: exam.subject?._id || "",
          title: exam.title || "",
          term: exam.term || "",
          academicYear: exam.academicYear || "",
          durationMinutes: exam.durationMinutes ?? 30,
          instructions: exam.instructions || "",
          questions: questions.map((q) => ({
            _id: q._id,
            text: q.text,
            imageUrl: q.imageUrl || null,
            imagePublicId: q.imagePublicId || null,
            type: q.type,
            marks: q.marks,
            options: q.options.map((o) => ({ _id: o._id, text: o.text, isCorrect: o.isCorrect })),
          })),
        });
      } catch (err) {
        setError(err.message);
      }
    };

    loadExam();
  }, [id, router]);

  const handleUpdate = async (payload, userId) => {
    const response = await fetch(`/api/exams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Failed to update exam");
    toast.success(
      data.regradedCount > 0
        ? `Exam updated. ${data.regradedCount} submitted attempt${data.regradedCount === 1 ? " was" : "s were"} re-graded.`
        : "Exam updated"
    );
    router.push("/dashboard/exams");
  };

  const renderBody = () => {
    if (error) return <p className="text-sm text-red-600">{error}</p>;
    if (!initialValues) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      );
    }
    const lockStructure = attemptCount > 0;
    return (
      <>
        {lockStructure ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">
              {attemptCount} student{attemptCount === 1 ? " has" : "s have"} already attempted this exam, so you can only make corrections.
            </p>
            <p className="mt-1">
              You can fix question and option wording, diagrams, marks and the correct answer. Questions and options
              can&apos;t be added, removed or reordered, and the class and subject are fixed. If you change a correct
              answer or marks, submitted attempts and their report-card scores are re-graded when you save. For bigger
              changes, close this exam and{" "}
              <Link href="/dashboard/exams/create" className="font-medium underline">create a new one</Link>.
            </p>
          </div>
        ) : (
          status !== "draft" && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              This exam is <strong>{status}</strong> but no student has started it yet, so you can still edit everything.
            </div>
          )
        )}
        <ExamForm initialValues={initialValues} submitLabel="Save changes" lockStructure={lockStructure} onSubmit={handleUpdate} />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-6 mx-auto md:mx-0">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl p-2 md:p-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Edit CBT Exam</h1>
          <p className="text-sm text-gray-600">Draft exams are only visible to students once published. Changes to a published exam apply immediately.</p>
        </div>

        {renderBody()}
      </div>
    </div>
  );
}
