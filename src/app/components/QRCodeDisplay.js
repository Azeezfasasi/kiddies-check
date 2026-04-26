"use client";

import { useState, useEffect } from "react";
import { X, Download, RefreshCw, Printer, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function QRCodeDisplay({ studentId, schoolId, userId, studentName, onClose }) {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchQRCode = async (regenerate = false) => {
    try {
      setLoading(true);
      const url = `/api/teacher/students/${studentId}/qrcode?schoolId=${schoolId}${regenerate ? "&regenerate=true" : ""}`;
      const res = await fetch(url, {
        headers: { "x-user-id": userId },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load QR code");
      }

      const data = await res.json();
      setQrData(data);
    } catch (error) {
      console.error("QR Code fetch error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchQRCode();
  }, [studentId, schoolId, userId]);

  const handleDownload = () => {
    if (!qrData?.qrCodeDataUrl) return;
    const link = document.createElement("a");
    link.href = qrData.qrCodeDataUrl;
    link.download = `qr-code-${qrData.student?.enrollmentNo || studentId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded");
  };

  const handlePrint = () => {
    if (!qrData?.qrCodeDataUrl) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>QR Code - ${studentName}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <h2 style="margin-bottom:8px;color:#1e3a8a;">${studentName}</h2>
          <p style="margin:4px 0;color:#666;">${qrData.student?.enrollmentNo || ""}</p>
          <img src="${qrData.qrCodeDataUrl}" style="width:300px;height:300px;margin:16px 0;" />
          <p style="font-size:12px;color:#999;margin-top:8px;">Kiddies Check Attendance QR</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    await fetchQRCode(true);
    toast.success("QR code regenerated");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg">Student QR Code</h3>
            <p className="text-blue-100 text-sm">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-500 text-sm">Generating QR code...</p>
            </div>
          ) : qrData?.qrCodeDataUrl ? (
            <>
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-blue-200 shadow-inner">
                <img
                  src={qrData.qrCodeDataUrl}
                  alt="Student QR Code"
                  className="w-64 h-64 object-contain"
                />
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 font-mono break-all max-w-[280px]">
                  {qrData.qrCodeString}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full mt-6">
                <button
                  onClick={handleDownload}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors text-sm font-medium"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex flex-col items-center gap-1.5 px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </button>
              </div>

              <div className="mt-4 bg-blue-50 rounded-lg p-3 w-full">
                <p className="text-xs text-blue-700 text-center">
                  Teachers can scan this QR code to quickly mark attendance for this student.
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-500">Failed to load QR code</p>
              <button
                onClick={() => fetchQRCode()}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

