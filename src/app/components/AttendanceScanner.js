"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, ScanLine, Loader } from "lucide-react";
import toast from "react-hot-toast";

export default function AttendanceScanner({ schoolId, userId, onScanSuccess }) {
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [loadingCameras, setLoadingCameras] = useState(true);
  const scannerInstanceRef = useRef(null);
  const isScanningRef = useRef(false);
  const containerRef = useRef(null);

  // Keep ref in sync with state for callbacks
  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    let cancelled = false;

    const getCameras = async () => {
      try {
        setLoadingCameras(true);
        const devices = await Html5Qrcode.getCameras();
        if (!cancelled && devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCamera(devices[0].id);
        }
      } catch (error) {
        console.error("Camera access error:", error);
        if (!cancelled) {
          toast.error("Could not access camera. Please ensure camera permissions are granted.");
        }
      } finally {
        if (!cancelled) setLoadingCameras(false);
      }
    };

    getCameras();

    return () => {
      cancelled = true;
      // Force cleanup on unmount
      if (scannerInstanceRef.current) {
        const instance = scannerInstanceRef.current;
        scannerInstanceRef.current = null;
        try {
          if (instance.isScanning) {
            instance.stop().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startScanning = useCallback(async () => {
    if (!selectedCamera) {
      toast.error("No camera selected");
      return;
    }

    try {
      // Ensure any previous instance is fully cleaned up
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            await scannerInstanceRef.current.stop();
          }
          await scannerInstanceRef.current.clear();
        } catch {
          // ignore cleanup errors
        }
        scannerInstanceRef.current = null;
      }

      // Small delay to let DOM settle
      await new Promise((r) => setTimeout(r, 100));

      scannerInstanceRef.current = new Html5Qrcode("qr-scanner-region");

      await scannerInstanceRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore frequent scan errors (no QR in frame)
        }
      );

      setIsScanning(true);
    } catch (error) {
      console.error("Start scanning error:", error);
      toast.error("Failed to start camera. Please try again.");
      scannerInstanceRef.current = null;
    }
  }, [selectedCamera]);

  const stopScanning = useCallback(async () => {
    try {
      if (scannerInstanceRef.current) {
        const instance = scannerInstanceRef.current;
        scannerInstanceRef.current = null;
        if (instance.isScanning) {
          await instance.stop();
        }
        await instance.clear();
      }
    } catch (error) {
      console.error("Stop scanning error:", error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleScanSuccess = useCallback(
    async (rawQrCodeString) => {
      // QR scanners often append newlines/whitespace — trim it
      const qrCodeString = rawQrCodeString?.trim();
      console.log("[QR Scan] Decoded:", JSON.stringify(qrCodeString));

      if (!qrCodeString) {
        toast.error("Empty QR code scanned");
        return;
      }

      try {
        await stopScanning();

        const res = await fetch(
          `/api/teacher/students/qr/${encodeURIComponent(qrCodeString)}?schoolId=${schoolId}`,
          {
            headers: { "x-user-id": userId },
          }
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Student not found");
        }

        const data = await res.json();
        onScanSuccess(data.student);
        toast.success(`Found: ${data.student.firstName} ${data.student.lastName}`);
      } catch (error) {
        console.error("QR lookup error:", error);
        toast.error(error.message);
        // Auto-restart scanning after a delay if lookup fails
        setTimeout(() => {
          if (!isScanningRef.current) startScanning();
        }, 1500);
      }
    },
    [schoolId, userId, onScanSuccess, stopScanning, startScanning]
  );

  const toggleScanning = useCallback(() => {
    if (isScanningRef.current) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [startScanning, stopScanning]);

  return (
    <div className="w-full">
      {/* Scanner Region — kept empty so html5-qrcode has full DOM control */}
      <div className="relative w-full aspect-square max-w-[400px] mx-auto rounded-2xl overflow-hidden border-2 transition-colors border-gray-200">
        <div
          id="qr-scanner-region"
          ref={containerRef}
          className="w-full h-full"
        />

        {/* Placeholder overlay — rendered OUTSIDE the scanner container */}
        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400 pointer-events-none">
            <ScanLine className="w-16 h-16 mb-3 opacity-40" />
            <p className="text-sm font-medium">Camera preview will appear here</p>
            <p className="text-xs mt-1">Point camera at student QR code</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-col items-center gap-4">
        {loadingCameras ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader className="w-4 h-4 animate-spin" />
            Loading cameras...
          </div>
        ) : cameras.length > 0 ? (
          <>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              disabled={isScanning}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Camera ${cam.id.slice(0, 8)}...`}
                </option>
              ))}
            </select>

            <button
              onClick={toggleScanning}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md hover:shadow-lg ${
                isScanning
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isScanning ? (
                <>
                  <CameraOff className="w-5 h-5" />
                  Stop Scanning
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Start Scanning
                </>
              )}
            </button>
          </>
        ) : (
          <div className="text-center text-red-500 text-sm bg-red-50 rounded-lg p-3">
            No cameras found. Please connect a camera and refresh.
          </div>
        )}
      </div>
    </div>
  );
}

