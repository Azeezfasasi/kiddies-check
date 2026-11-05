"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Commet } from "react-loading-indicators";
import { useAuth } from "@/context/AuthContext";
import type { Loose } from "@/types/loose";
import ReportCardForm, { type ReportCardPayload } from "../../components/ReportCardForm";

export default function EditReportCardPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [card, setCard] = useState<Loose | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const loadCard = async () => {
      try {
        const res = await fetch(`/api/report-cards/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to load report card");
        setCard(data.reportCard);
      } catch (err) {
        setError(err.message);
      }
    };

    loadCard();
  }, [id, token]);

  const handleUpdate = async (payload: ReportCardPayload) => {
    const response = await fetch(`/api/report-cards/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user?._id || localStorage.getItem("userId") || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Failed to update report card");
    toast.success(card?.status === "published" ? "Report card updated. Parents will see the changes." : "Report card updated");
    router.push("/dashboard/report-cards");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <p className="mx-auto max-w-6xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex justify-center items-center h-screen py-12">
        <Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" />
      </div>
    );
  }

  const studentName = card.student ? `${card.student.firstName || ""} ${card.student.lastName || ""}`.trim() : "this student";

  return (
    <ReportCardForm
      title="Edit Report Card"
      description={
        card.status === "published"
          ? `Editing ${studentName}'s published report card. Parents see the changes as soon as you save.`
          : `Editing ${studentName}'s report card.`
      }
      submitLabel="Save changes"
      initialCard={card}
      onSubmit={handleUpdate}
    />
  );
}
