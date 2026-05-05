"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, X } from "lucide-react";

export default function AccessCard({ student, schoolName, onClose }) {
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrCode, setQrCode] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Generate QR code data - contains student ID and school info
    const qrData = JSON.stringify({
      studentId: student._id,
      name: student.name,
      studentNo: student.studentNo,
      schoolId: student.schoolId,
      timestamp: new Date().toISOString(),
    });

    QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 200,
      margin: 0,
    }).then(setQrCode);
  }, [student]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const element = cardRef.current;
      if (!element) return;

      // Create a canvas from the element
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set canvas size with high DPI for better quality
      const scale = 2;
      canvas.width = element.offsetWidth * scale;
      canvas.height = element.offsetHeight * scale;

      ctx.scale(scale, scale);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, element.offsetWidth, element.offsetHeight);

      // Draw using SVG method
      const svg = new XMLSerializer().serializeToString(element);
      const img = new Image();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        ctx.drawImage(img, 0, 0, element.offsetWidth, element.offsetHeight);
        URL.revokeObjectURL(url);

        // Convert canvas to image and download
        canvas.toBlob((blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `access-card-${student.name
            .replace(/\s+/g, "-")
            .toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          setIsDownloading(false);
        }, "image/png");
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback: use print method
        const printWindow = window.open("", "", "height=600,width=800");
        printWindow.document.write("<html><head><title>Access Card</title></head><body>");
        printWindow.document.write(element.outerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
        setIsDownloading(false);
      };

      img.src = url;
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: use print method
      try {
        const printWindow = window.open("", "", "height=600,width=800");
        const element = cardRef.current;
        printWindow.document.write("<html><head><title>Access Card</title></head><body>");
        printWindow.document.write(element.outerHTML);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      } catch (printError) {
        console.error("Print error:", printError);
      }
      setIsDownloading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 h-[950px] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{student.firstName} {student.lastName} Access Card</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center">
          <div
            ref={cardRef}
            className="w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
            style={{
              backgroundImage:
                "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)",
            }}
          >
            {/* Card Header - Logo Area */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center relative">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-blue-700 font-bold text-2xl">👤</span>
                </div>
              </div>
              <p className="text-white text-xs font-semibold tracking-widest">
                STUDENT ACCESS CARD
              </p>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Student Name */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="text-sm text-blue-600 font-semibold tracking-wide">
                  {student.enrollmentNo || "Enrollment No: N/A"}
                </p>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                {/* Grade */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1">
                    Grade
                  </p>
                  <p className="text-gray-800 font-bold text-lg">
                    {student.gradeLevel || "N/A"}
                  </p>
                </div>

                {/* Class */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1">
                    School Type
                  </p>
                  <p className="text-gray-800 font-bold text-sm capitalize">
                    {student.schoolType || "N/A"}
                  </p>
                </div>

                {/* ID Number */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1">
                    ID No
                  </p>
                  <p className="text-gray-800 font-mono font-bold text-lg">
                    {student.enrollmentNo || "N/A"}
                  </p>
                </div>

                {/* Date of Birth */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1">
                    DOB
                  </p>
                  <p className="text-gray-800 font-bold text-sm">
                    {formatDate(student.dateOfBirth)}
                  </p>
                </div>
              </div>

              {/* Email */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-gray-800 text-sm truncate">
                  {student.email || "email@example.com"}
                </p>
              </div> */}

              {/* QR Code Section */}
              <div className="flex flex-col items-center mb-6 bg-gradient-to-b from-gray-50 to-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                {qrCode && (
                  <div className="bg-white p-2 rounded-lg shadow">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-32 h-32"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-600 mt-3 text-center font-semibold">
                  Scan for attendance
                </p>
              </div>

              {/* School Name Footer */}
              <div className="border-t-2 border-gray-200 pt-4 text-center">
                <p className="text-gray-600 font-bold text-sm">
                  {schoolName || "NAME OF SCHOOL"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Valid for the Current Academic Year
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Close
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            {isDownloading ? "Downloading..." : "Download Card"}
          </button>
        </div>
      </div>
    </div>
  );
}
