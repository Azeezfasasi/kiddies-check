"use client";

import React, { useEffect, useState } from "react";
import AttendanceChart from "@/components/dashboard-component/AttendanceChart";

export default function SchoolBaseAttendanceChat() {
  const [schoolId, setSchoolId] = useState("");

  useEffect(() => {
    try {
      const storedSchoolId = localStorage.getItem("schoolId") || "";
      setSchoolId(storedSchoolId);
    } catch (error) {
      console.error("Failed to read school context:", error);
    }
  }, []);

  if (!schoolId) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Loading school attendance context...</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <AttendanceChart
        schoolId={schoolId}
        title="School Attendance Overview"
      />
    </div>
  );
}
