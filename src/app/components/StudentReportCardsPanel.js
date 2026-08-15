"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader, FileText, Download, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import NurseryReportCard from "@/components/dashboard-components/report-cards/NurseryReportCard";
import PrimaryReportCard from "@/components/dashboard-components/report-cards/PrimaryReportCard";

function dataForCard(card) {
  if (card.cardType === "nursery") return card.nurseryData || {};
  if (card.cardType === "secondary") return card.secondaryData || {};
  return card.primaryData || {};
}

export default function StudentReportCardsPanel({
  studentId,
  studentName,
  schoolId,
  userId,
  schoolName = "",
  schoolLogo = "",
  onClose,
}) {
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    const fetchReportCards = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/report-cards?schoolId=${schoolId}`, {
          headers: {
            "x-user-id": userId,
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || "Failed to load report cards");
        setReportCards((data.reportCards || []).filter((card) => card.student?._id === studentId));
      } catch (error) {
        console.error("Error fetching report cards:", error);
        toast.error("Failed to load report cards");
      } finally {
        setLoading(false);
      }
    };

    fetchReportCards();
  }, [schoolId, studentId, userId]);

  const handleDownload = async () => {
    if (!previewRef.current || !selectedCard) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 8, 8, imgWidth, imgHeight);
      const safeName = studentName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "student";
      pdf.save(`${selectedCard.cardType}-report-card-${safeName}.pdf`);
      toast.success("PDF download started");
    } catch (error) {
      console.error(error);
      toast.error("Unable to generate PDF right now");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {selectedCard && (
              <button onClick={() => setSelectedCard(null)} className="text-gray-500 hover:text-gray-700 mr-1" title="Back to list">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-800">
              {selectedCard ? `${studentName}'s Report Card` : `${studentName}'s Report Cards`}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : !selectedCard ? (
            reportCards.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No published report cards yet for {studentName}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reportCards.map((card) => (
                  <button
                    key={card._id}
                    onClick={() => setSelectedCard(card)}
                    className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">{card.cardType} Report Card</p>
                      <p className="text-sm text-gray-500">{card.term} · {card.academicYear}</p>
                    </div>
                    <span className="text-sm font-medium text-blue-600">View →</span>
                  </button>
                ))}
              </div>
            )
          ) : (
            <div>
              <div className="mb-4 flex justify-end">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {downloading ? "Preparing..." : "Download PDF"}
                </button>
              </div>
              <div ref={previewRef} className="-mx-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 sm:mx-0">
                <div className="min-w-[850px]">
                  {selectedCard.cardType === "nursery" ? (
                    <NurseryReportCard
                      data={dataForCard(selectedCard)}
                      studentName={studentName}
                      className={selectedCard.class?.name || ""}
                      teacher={dataForCard(selectedCard).teacher}
                      term={selectedCard.term}
                      academicYear={selectedCard.academicYear}
                      schoolName={schoolName}
                      schoolLogo={schoolLogo}
                    />
                  ) : (
                    <PrimaryReportCard
                      data={dataForCard(selectedCard)}
                      studentName={studentName}
                      className={selectedCard.class?.name || ""}
                      teacher={dataForCard(selectedCard).teacher}
                      term={selectedCard.term}
                      academicYear={selectedCard.academicYear}
                      schoolName={schoolName}
                      schoolLogo={schoolLogo}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
