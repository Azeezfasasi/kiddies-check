"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import NurseryReportCard from "@/components/dashboard-components/report-cards/NurseryReportCard";
import PrimaryReportCard from "@/components/dashboard-components/report-cards/PrimaryReportCard";
import Link from "next/link";

export default function ReportCardsPage() {
  const { user, token } = useAuth();
  const [schoolId, setSchoolId] = useState("");
  const [reportCards, setReportCards] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [cardType, setCardType] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCardId, setEditingCardId] = useState("");
  const [editForm, setEditForm] = useState({ term: "", academicYear: "", notes: "" });
  const [deletingId, setDeletingId] = useState("");
  const [downloadCard, setDownloadCard] = useState(null);

  useEffect(() => {
    const storedSchoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    if (storedSchoolId) setSchoolId(storedSchoolId);
  }, []);

  const loadReports = async () => {
    if (!schoolId || !token) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/report-cards?schoolId=${schoolId}&studentName=${studentName}&className=${className}&cardType=${cardType}`, {
        headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
      });
      const data = await response.json();
      if (data.success) {
        setReportCards(data.reportCards || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!schoolId || !token) return;
    loadReports();
  }, [schoolId, studentName, className, cardType, token, user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this report card?")) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/report-cards/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to delete report card");
      toast.success("Report card deleted");
      await loadReports();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId("");
    }
  };

  const startEdit = (card) => {
    setEditingCardId(card._id);
    setEditForm({ term: card.term || "", academicYear: card.academicYear || "", notes: card.notes || "" });
  };

  const handleUpdate = async (card) => {
    try {
      const response = await fetch(`/api/report-cards/${card._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?._id || localStorage.getItem("userId") || "",
        },
        body: JSON.stringify({
          term: editForm.term,
          academicYear: editForm.academicYear,
          notes: editForm.notes,
          nurseryData: card.cardType === "nursery" ? card.nurseryData : undefined,
          primaryData: card.cardType === "primary" ? card.primaryData : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to update report card");
      toast.success("Report card updated");
      setEditingCardId("");
      await loadReports();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDownloadPdf = async (card) => {
    const cardToDownload = card;
    setDownloadCard(cardToDownload);

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const preview = document.getElementById("report-card-download-preview");
    if (!preview) {
      toast.error("Preview is not ready yet");
      setDownloadCard(null);
      return;
    }

    try {
      const canvas = await html2canvas(preview, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 8 * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 8, 8, imgWidth, imgHeight);
      const name = cardToDownload.student ? `${cardToDownload.student.firstName || ""} ${cardToDownload.student.lastName || ""}`.trim() : "student";
      const safeName = name.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "student";
      pdf.save(`${cardToDownload.cardType}-report-card-${safeName}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Unable to download PDF");
    } finally {
      setDownloadCard(null);
    }
  };

  const schoolName = user?.schoolName || user?.school || localStorage.getItem("schoolName") || "School Name";
  const schoolLogo = user?.schoolLogo || localStorage.getItem("schoolLogo") || "";

  const ActionButtons = ({ card }) => (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => startEdit(card)} className="flex-1 min-w-[72px] rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 sm:flex-none">
        Edit
      </button>
      <button
        type="button"
        onClick={() => handleDelete(card._id)}
        disabled={deletingId === card._id}
        className="flex-1 min-w-[72px] rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-60 sm:flex-none"
      >
        {deletingId === card._id ? "Deleting..." : "Delete"}
      </button>
      <button type="button" onClick={() => handleDownloadPdf(card)} className="flex-1 min-w-[72px] rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 sm:flex-none">
        Download
      </button>
    </div>
  );

  const EditPanel = ({ card }) => (
    <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Term</label>
        <input value={editForm.term} onChange={(e) => setEditForm((prev) => ({ ...prev, term: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Academic Year</label>
        <input value={editForm.academicYear} onChange={(e) => setEditForm((prev) => ({ ...prev, academicYear: e.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
        <textarea value={editForm.notes} onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end md:col-span-3">
        <button type="button" onClick={() => setEditingCardId("")} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          Cancel
        </button>
        <button type="button" onClick={() => handleUpdate(card)} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Save changes
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Report Cards</h1>
            <p className="text-sm text-gray-600">Browse generated report cards and filter by student or class.</p>
          </div>
          <Link
            href="/dashboard/report-cards/create"
            className="inline-block w-full rounded bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Create Report Card
          </Link>
        </div>

        <div className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-3">
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Filter by student name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Filter by class"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:col-span-2 md:col-span-1">
            <option value="">All report card types</option>
            <option value="nursery">Nursery</option>
            <option value="primary">Primary</option>
          </select>
        </div>

        {downloadCard && (
          <div id="report-card-download-preview" className="fixed left-[-9999px] top-0 w-[850px] bg-white p-4">
            {downloadCard.cardType === "nursery" ? (
              <NurseryReportCard
                data={downloadCard.nurseryData || {}}
                studentName={downloadCard.student ? `${downloadCard.student.firstName || ""} ${downloadCard.student.lastName || ""}`.trim() : ""}
                className={downloadCard.class ? downloadCard.class.name : ""}
                teacher={downloadCard.nurseryData?.teacher || ""}
                term={downloadCard.term}
                academicYear={downloadCard.academicYear}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
              />
            ) : (
              <PrimaryReportCard
                data={downloadCard.primaryData || {}}
                studentName={downloadCard.student ? `${downloadCard.student.firstName || ""} ${downloadCard.student.lastName || ""}`.trim() : ""}
                className={downloadCard.class ? downloadCard.class.name : ""}
                teacher={downloadCard.primaryData?.teacher || ""}
                term={downloadCard.term}
                academicYear={downloadCard.academicYear}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
              />
            )}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">Loading report cards...</div>
        ) : reportCards.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-600">No report cards found for this school.</div>
        ) : (
          <>
            {/* MOBILE: stacked cards (below md) */}
            <div className="flex flex-col gap-3 md:hidden">
              {reportCards.map((card) => (
                <div key={card._id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {card.student ? `${card.student.firstName} ${card.student.lastName}` : "—"}
                      </p>
                      <p className="text-sm text-gray-500">{card.class ? card.class.name : "—"}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs font-medium capitalize text-gray-700">
                      {card.status}
                    </span>
                  </div>

                  <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                    <dt className="text-gray-500">Type</dt>
                    <dd className="text-right capitalize text-gray-900">{card.cardType}</dd>
                    <dt className="text-gray-500">Term</dt>
                    <dd className="text-right text-gray-900">{card.term}</dd>
                    <dt className="text-gray-500">Academic Year</dt>
                    <dd className="text-right text-gray-900">{card.academicYear}</dd>
                  </dl>

                  <ActionButtons card={card} />

                  {editingCardId === card._id && (
                    <div className="mt-3">
                      <EditPanel card={card} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* DESKTOP: table (md and up) */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Class</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Term</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Academic Year</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportCards.map((card) => (
                      <React.Fragment key={card._id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3">{card.student ? `${card.student.firstName} ${card.student.lastName}` : "—"}</td>
                          <td className="px-4 py-3">{card.class ? card.class.name : "—"}</td>
                          <td className="px-4 py-3 capitalize">{card.cardType}</td>
                          <td className="px-4 py-3">{card.term}</td>
                          <td className="px-4 py-3">{card.academicYear}</td>
                          <td className="px-4 py-3 capitalize">{card.status}</td>
                          <td className="px-4 py-3">
                            <ActionButtons card={card} />
                          </td>
                        </tr>
                        {editingCardId === card._id && (
                          <tr>
                            <td colSpan={7} className="px-4 py-3">
                              <EditPanel card={card} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}