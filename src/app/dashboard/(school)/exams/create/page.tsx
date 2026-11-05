"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ExamForm from "../components/ExamForm";

export default function CreateExamPage() {
  const router = useRouter();

  const handleCreate = async (payload, userId) => {
    const response = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Failed to create exam");
    toast.success("Exam saved as draft");
    router.push("/dashboard/exams");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-0 md:p-6 mx-auto md:mx-0">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl p-2 md:p-4">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Create CBT Exam</h1>
          <p className="text-sm text-gray-600">Build an objective exam. It&apos;s saved as a draft until you publish it.</p>
        </div>

        <ExamForm submitLabel="Save as draft" onSubmit={handleCreate} />
      </div>
    </div>
  );
}
