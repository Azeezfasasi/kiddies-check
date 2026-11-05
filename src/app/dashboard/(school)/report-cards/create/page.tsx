"use client";

import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import ReportCardForm, { type ReportCardPayload } from "../components/ReportCardForm";

export default function CreateReportCardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleCreate = async (payload: ReportCardPayload) => {
    const response = await fetch("/api/report-cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user?._id || localStorage.getItem("userId") || "",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Failed to save report card");
    toast.success("Report card created successfully");
    router.push("/dashboard/report-cards");
  };

  return (
    <ReportCardForm
      title="Create Report Card"
      description="Create a school-scoped report card for an enrolled student."
      submitLabel="Create report card"
      onSubmit={handleCreate}
    />
  );
}
