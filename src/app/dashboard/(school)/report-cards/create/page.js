"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import NurseryReportCard from "@/components/dashboard-components/report-cards/NurseryReportCard";
import PrimaryReportCard from "@/components/dashboard-components/report-cards/PrimaryReportCard";
import { Commet } from "react-loading-indicators";

const nurseryTemplate = {
  childName: "",
  className: "",
  teacher: "",
  term: "First Term",
  academicYear: "",
  ratingData: [],
  generalComments: ["", "", ""],
};

const primaryTemplate = {
  childName: "",
  className: "",
  teacher: "",
  term: "First Term",
  academicYear: "",
  attendance: [],
  conduct: {},
  physical: {},
  subjects: [],
  sports: {},
  clubs: [],
  footer: {},
};

const defaultNurseryQuestions = [
  { type: "section", label: "SOCIAL AND EMOTIONAL LEARNING" },
  { type: "question", label: "Adjusting to Nur. Experiments?" },
  { type: "question", label: "Get along with other?" },
  { type: "question", label: "Very Shy?" },
  { type: "question", label: "Fights Often?" },
  { type: "question", label: "Ready to share with others" },
  { type: "question", label: "Considerate to others" },
  { type: "question", label: "Self Confident?" },
  { type: "question", label: "Punctual?" },
  { type: "question", label: "Cross Motor Skills - throwing balls, running, jumping, climbing?" },
  { type: "question", label: "Participate in mutual work e.g gardening?" },
  { type: "question", label: "Physical defects - easily fatigued?" },
  { type: "subsection", label: "Language Learning" },
  { type: "question", label: "Skill in listening and understanding spoken language skills" },
  { type: "section", label: "INTELLECTUAL DEVELOPMENT" },
  { type: "question", label: "Able to solve problems" },
  { type: "question", label: "Able to seek relationships" },
  { type: "question", label: "Able to extend his experience" },
  { type: "question", label: "Able to gain information" },
  { type: "section", label: "PHYSICAL DEVELOPMENT" },
  { type: "question", label: "Fine Motor Skills - handling small toys, drawing, crayon, writing" },
  { type: "question", label: "Attention Span" },
  { type: "question", label: "Personal Attractiveness Neatness - Clothes, Shoes, Hair, Teeth, Nails Skin" },
];

const defaultPrimarySubjects = [
  "English Language",
  "Mathematics",
  "Verbal Reasoning",
  "Basic Science and Tech.",
  "Vocational Studies",
  "National Value",
  "Nigerian Language",
  "Creative Arts",
  "Physical & Health Educ.",
  "Phonics",
  "Practical Agric.",
  "Home Economics",
  "French",
  "Music",
  "Computer Studies",
  "Writing",
];

export default function CreateReportCardPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [schoolId, setSchoolId] = useState("");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schoolSubjects, setSchoolSubjects] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [cardType, setCardType] = useState("nursery");
  const [formData, setFormData] = useState(nurseryTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [syncingAssessments, setSyncingAssessments] = useState(false);
  const [school, setSchool] = useState(null);
  const [academicSessions, setAcademicSessions] = useState([]);
  const previewRef = useRef(null);

  useEffect(() => {
    const storedSchoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    if (storedSchoolId) setSchoolId(storedSchoolId);
  }, []);

  useEffect(() => {
    if (!schoolId || !token) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [classesRes, schoolRes, calendarRes] = await Promise.all([
          fetch(`/api/teacher/classes?schoolId=${schoolId}`, {
            headers: {
              "x-user-id": user?._id || localStorage.getItem("userId") || "",
              Authorization: token ? `Bearer ${token}` : "",
            },
          }),
          fetch(`/api/schools/${schoolId}`, {
            headers: {
              "x-user-id": user?._id || localStorage.getItem("userId") || "",
              Authorization: token ? `Bearer ${token}` : "",
            },
          }),
          fetch(`/api/admin/academic-calendar`, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }),
        ]);
        const classesData = await classesRes.json();
        const schoolData = await schoolRes.json();
        const calendarData = await calendarRes.json();

        if (classesData?.classes) setClasses(classesData.classes);
        if (schoolData?.success && schoolData.school) {
          setSchool(schoolData.school);
        } else if (schoolData?.data) {
          setSchool(schoolData.data);
        }
        if (calendarData?.success && Array.isArray(calendarData.terms)) {
          const sessions = Array.from(new Set(calendarData.terms.map((t) => t.session))).sort().reverse();
          setAcademicSessions(sessions);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [schoolId, token, user]);

  useEffect(() => {
    if (!schoolId || !token) return;

    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentId("");
      setSchoolSubjects([]);
      return;
    }

    const loadStudentsAndSubjects = async () => {
      setStudentsLoading(true);
      try {
        const [studentsRes, subjectsRes] = await Promise.all([
          fetch(`/api/teacher/students?schoolId=${schoolId}&classId=${selectedClassId}`, {
            headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
          }),
          fetch(`/api/teacher/subjects?schoolId=${schoolId}&classId=${selectedClassId}`, {
            headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
          }),
        ]);
        const studentsData = await studentsRes.json();
        const subjectsData = await subjectsRes.json();

        setStudents(studentsData?.data || []);
        setSchoolSubjects(subjectsData?.subjects || []);
        setSelectedStudentId("");
      } catch (error) {
        console.error(error);
        setStudents([]);
        setSchoolSubjects([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudentsAndSubjects();
  }, [schoolId, selectedClassId, token, user]);

  useEffect(() => {
    if (cardType === "nursery") {
      setFormData((prev) => ({ ...nurseryTemplate, ...prev, ratingData: prev.ratingData?.length ? prev.ratingData : defaultNurseryQuestions.map((q) => ({ ...q, rating: 0 })), generalComments: prev.generalComments?.length ? prev.generalComments : ["", "", ""] }));
    } else {
      const subjectRows = schoolSubjects.length
        ? schoolSubjects.map((s) => ({ subjectId: s._id, subject: s.name, continuousAssess: "", testScore: "", total: "" }))
        : defaultPrimarySubjects.map((subject) => ({ subject, continuousAssess: "", testScore: "", total: "" }));
      const schoolSubjectIds = schoolSubjects.map((s) => s._id).sort().join(",");

      setFormData((prev) => {
        const prevSubjectIds = (prev.subjects || []).map((s) => s.subjectId).filter(Boolean).sort().join(",");
        const subjectsChanged = !prev.subjects?.length || (schoolSubjects.length > 0 && prevSubjectIds !== schoolSubjectIds);

        return {
          ...primaryTemplate,
          ...prev,
          attendance: prev.attendance?.length ? prev.attendance : [
            { label: "No. of Times School Opened/Activities Held", school: "", sports: "", activities: "" },
            { label: "No. of Times Present", school: "", sports: "", activities: "" },
            { label: "No. of Times Punctual", school: "", sports: "", activities: "" },
          ],
          subjects: subjectsChanged ? subjectRows : prev.subjects,
          clubs: prev.clubs?.length ? prev.clubs : [{ organization: "", office: "", contribution: "" }, { organization: "", office: "", contribution: "" }],
        };
      });
    }
    // Rebuild subject rows whenever the class's subject list changes, not on every formData edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardType, schoolSubjects]);

  const selectedStudent = useMemo(() => students.find((student) => student._id === selectedStudentId) || null, [selectedStudentId, students]);
  const selectedClass = useMemo(() => classes.find((classItem) => classItem._id === selectedClassId) || null, [selectedClassId, classes]);

  // Academic Year options: sessions configured in the school calendar, plus a
  // small fallback range (and the currently selected value) so the dropdown
  // is never empty or silently drops a legacy freeform value.
  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const fallbackYears = [-1, 0, 1].map((offset) => `${currentYear + offset}/${currentYear + offset + 1}`);
    const options = new Set([...academicSessions, ...fallbackYears]);
    if (formData.academicYear) options.add(formData.academicYear);
    return Array.from(options).sort().reverse();
  }, [academicSessions, formData.academicYear]);

  const termOptions = ["First Term", "Second Term", "Third Term"];

  // Pre-fill CA / Exam / Total from recorded assessments once student, class, term and
  // year are all selected. Only fills blank fields — never overwrites a teacher's edits.
  useEffect(() => {
    if (cardType === "nursery") return;
    if (!schoolId || !selectedStudentId || !selectedClassId || !formData.term || !formData.academicYear) return;

    const controller = new AbortController();

    const syncFromAssessments = async () => {
      setSyncingAssessments(true);
      try {
        const params = new URLSearchParams({
          schoolId,
          studentId: selectedStudentId,
          term: formData.term,
          academicYear: formData.academicYear,
        });
        const res = await fetch(`/api/report-cards/assessment-summary?${params.toString()}`, {
          headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
          signal: controller.signal,
        });
        const data = await res.json();
        if (!data?.success || !Array.isArray(data.subjects) || !data.subjects.length) return;

        const bySubjectId = new Map(data.subjects.map((s) => [s.subjectId, s]));
        let filledCount = 0;

        setFormData((prev) => ({
          ...prev,
          subjects: (prev.subjects || []).map((row) => {
            const summary = row.subjectId ? bySubjectId.get(row.subjectId) : null;
            if (!summary) return row;

            const next = { ...row };
            if (!next.continuousAssess && summary.continuousAssess !== null) next.continuousAssess = String(summary.continuousAssess);
            if (!next.testScore && summary.testScore !== null) next.testScore = String(summary.testScore);
            if (!next.total && summary.total !== null) next.total = String(summary.total);
            if (next.continuousAssess !== row.continuousAssess || next.testScore !== row.testScore || next.total !== row.total) filledCount += 1;
            return next;
          }),
        }));

        if (filledCount > 0) {
          toast.success(`Synced ${filledCount} subject${filledCount === 1 ? "" : "s"} from recorded assessments`);
        }
      } catch (error) {
        if (error.name !== "AbortError") console.error(error);
      } finally {
        setSyncingAssessments(false);
      }
    };

    syncFromAssessments();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardType, schoolId, selectedStudentId, selectedClassId, formData.term, formData.academicYear]);

  const handleDownloadPdf = async () => {
    if (!previewRef.current) {
      toast.error("Preview is not ready yet");
      return;
    }

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const studentName = selectedStudent ? `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() : "student";
      const safeName = studentName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "student";
      pdf.save(`${cardType}-report-card-${safeName}.pdf`);
      toast.success("PDF download started");
    } catch (error) {
      console.error(error);
      toast.error("Unable to generate PDF right now");
    }
  };

  const handleChange = (path, value) => {
    setFormData((prev) => {
      const next = { ...prev };
      if (path.includes(".")) {
        const [first, second] = path.split(".");
        next[first] = { ...(next[first] || {}), [second]: value };
      } else {
        next[path] = value;
      }
      return next;
    });
  };

  const handleNurseryRatingChange = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      ratingData: prev.ratingData.map((item, itemIndex) => (itemIndex === index ? { ...item, rating: value } : item)),
    }));
  };

  const handlePrimarySubjectChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [field]: value };
        if (field === "continuousAssess" || field === "testScore") {
          const ca = next.continuousAssess === "" ? null : Number(next.continuousAssess);
          const exam = next.testScore === "" ? null : Number(next.testScore);
          const hasCa = ca !== null && Number.isFinite(ca);
          const hasExam = exam !== null && Number.isFinite(exam);
          next.total = hasCa || hasExam ? String(Math.round(((hasCa ? ca : 0) + (hasExam ? exam : 0)) * 10) / 10) : "";
        }
        return next;
      }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedClassId) {
      toast.error("Please choose a student and class");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        schoolId,
        studentId: selectedStudentId,
        classId: selectedClassId,
        cardType,
        term: formData.term,
        academicYear: formData.academicYear,
        nurseryData: cardType === "nursery" ? formData : null,
        primaryData: cardType === "primary" ? formData : null,
        secondaryData: cardType === "secondary" ? formData : null,
        status: "published",
      };

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
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const schoolName = school?.name || user?.schoolName || user?.school || localStorage.getItem("schoolName") || "School Name";
  const schoolLogo = school?.logo || user?.schoolLogo || localStorage.getItem("schoolLogo") || "";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen py-12">
        <p className="text-gray-600"><Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" /></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-0 sm:p-6 overflow-x-hidden">
      <div className="mx-auto max-w-6xl rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Create Report Card</h1>
          <p className="text-sm text-gray-600">Create a school-scoped report card for an enrolled student.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId("");
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="">Select class</option>
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>{classItem.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={!selectedClassId || studentsLoading}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">{selectedClassId ? (studentsLoading ? "Loading students..." : "Select student") : "Select a class first"}</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>{student.firstName} {student.lastName}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Card Type</label>
              <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="nursery">Nursery</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Teacher / Observer</label>
              <input value={formData.teacher || ""} onChange={(e) => handleChange("teacher", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Term</label>
              <select value={formData.term || ""} onChange={(e) => handleChange("term", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">Select term</option>
                {termOptions.map((term) => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Academic Year</label>
              <select value={formData.academicYear || ""} onChange={(e) => handleChange("academicYear", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                <option value="">Select academic year</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {cardType === "nursery" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Ratings</h2>
                <div className="space-y-2">
                  {formData.ratingData?.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <select value={item.rating || 0} onChange={(e) => handleNurseryRatingChange(index, Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2 sm:w-auto">
                        <option value={0}>Excellent</option>
                        <option value={1}>Good</option>
                        <option value={2}>Fair</option>
                        <option value={3}>Poor</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">General Comments</h2>
                {formData.generalComments?.map((comment, index) => (
                  <textarea key={index} value={comment} onChange={(e) => {
                    const nextComments = [...(formData.generalComments || [])];
                    nextComments[index] = e.target.value;
                    handleChange("generalComments", nextComments);
                  }} className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Attendance</h2>
                {formData.attendance?.map((row, index) => (
                  <div key={row.label} className="mb-3 grid gap-2 rounded-lg border border-gray-100 p-2 sm:mb-2 sm:grid-cols-2 sm:border-0 sm:p-0 md:grid-cols-4">
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="mb-1 block text-xs font-medium text-gray-600">Criteria</label>
                      <input value={row.label} onChange={(e) => { const next = [...formData.attendance]; next[index].label = e.target.value; handleChange("attendance", next); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">School</label>
                      <input value={row.school} onChange={(e) => { const next = [...formData.attendance]; next[index].school = e.target.value; handleChange("attendance", next); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Sports</label>
                      <input value={row.sports} onChange={(e) => { const next = [...formData.attendance]; next[index].sports = e.target.value; handleChange("attendance", next); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Activities</label>
                      <input value={row.activities} onChange={(e) => { const next = [...formData.attendance]; next[index].activities = e.target.value; handleChange("attendance", next); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Conduct</h2>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Green Number</label>
                    <input value={formData.conduct?.greenNumber || ""} onChange={(e) => handleChange("conduct.greenNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Red Number</label>
                    <input value={formData.conduct?.redNumber || ""} onChange={(e) => handleChange("conduct.redNumber", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Green Deed</label>
                    <input value={formData.conduct?.greenDeed || ""} onChange={(e) => handleChange("conduct.greenDeed", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Red Deed</label>
                    <input value={formData.conduct?.redDeed || ""} onChange={(e) => handleChange("conduct.redDeed", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Comments</label>
                    <textarea value={formData.conduct?.comments || ""} onChange={(e) => handleChange("conduct.comments", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">Remarks</label>
                    <textarea value={formData.conduct?.remarks || ""} onChange={(e) => handleChange("conduct.remarks", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Physical Development</h2>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Height (Start of Term)</label>
                    <input value={formData.physical?.heightStart || ""} onChange={(e) => handleChange("physical.heightStart", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Height (End of Term)</label>
                    <input value={formData.physical?.heightEnd || ""} onChange={(e) => handleChange("physical.heightEnd", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Weight (Start of Term)</label>
                    <input value={formData.physical?.weightStart || ""} onChange={(e) => handleChange("physical.weightStart", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Weight (End of Term)</label>
                    <input value={formData.physical?.weightEnd || ""} onChange={(e) => handleChange("physical.weightEnd", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Days Absent Due to Illness</label>
                    <input value={formData.physical?.illnessDays || ""} onChange={(e) => handleChange("physical.illnessDays", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Nature of Illness</label>
                    <input value={formData.physical?.illnessNature || ""} onChange={(e) => handleChange("physical.illnessNature", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cleanliness Rating</label>
                    <input value={formData.physical?.cleanliness || ""} onChange={(e) => handleChange("physical.cleanliness", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Cleanliness Remarks</label>
                    <input value={formData.physical?.cleanlinessRemarks || ""} onChange={(e) => handleChange("physical.cleanlinessRemarks", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-800">Subject Performance</h2>
                  {syncingAssessments && (
                    <span className="text-xs font-medium text-blue-600">Syncing from assessments…</span>
                  )}
                </div>
                <p className="mb-3 -mt-2 text-xs text-gray-500">CA (out of 40) and Exam (out of 60) are pre-filled from this student&apos;s recorded assessments for the selected term — feel free to override any value. Total is calculated automatically out of 100.</p>
                <div className="space-y-2">
                  {formData.subjects?.map((subject, index) => (
                    <div key={`${subject.subject}-${index}`} className="grid gap-2 rounded-lg border border-gray-100 p-2 sm:grid-cols-2 sm:border-0 sm:p-0 md:grid-cols-4">
                      <div className="sm:col-span-2 md:col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Subject</label>
                        <input value={subject.subject} onChange={(e) => handlePrimarySubjectChange(index, "subject", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">CA/Test (Max 40)</label>
                        <input type="number" min={0} max={40} step="0.5" value={subject.continuousAssess} onChange={(e) => handlePrimarySubjectChange(index, "continuousAssess", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Exam (Max 60)</label>
                        <input type="number" min={0} max={60} step="0.5" value={subject.testScore} onChange={(e) => handlePrimarySubjectChange(index, "testScore", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">Total (Max 100)</label>
                        <input value={subject.total} readOnly title="Auto-calculated from CA + Exam" className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Sports and Clubs</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Sports Level</label>
                    <input value={formData.sports?.level || ""} onChange={(e) => handleChange("sports.level", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
                    <label className="mb-1 mt-3 block text-xs font-medium text-gray-600">Sports Comments</label>
                    <textarea value={formData.sports?.comments || ""} onChange={(e) => handleChange("sports.comments", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} />
                  </div>
                  <div className="space-y-3">
                    {formData.clubs?.map((club, index) => (
                      <div key={`${club.organization}-${index}`} className="rounded-lg border border-gray-200 p-3">
                        <label className="mb-1 block text-xs font-medium text-gray-600">Organization</label>
                        <input value={club.organization} onChange={(e) => { const next = [...formData.clubs]; next[index].organization = e.target.value; handleChange("clubs", next); }} className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
                        <label className="mb-1 block text-xs font-medium text-gray-600">Office Held</label>
                        <input value={club.office} onChange={(e) => { const next = [...formData.clubs]; next[index].office = e.target.value; handleChange("clubs", next); }} className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2" />
                        <label className="mb-1 block text-xs font-medium text-gray-600">Contribution</label>
                        <textarea value={club.contribution} onChange={(e) => { const next = [...formData.clubs]; next[index].contribution = e.target.value; handleChange("clubs", next); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="hidden lg:block rounded-xl border border-gray-200 bg-gray-50 p-3 sm:rounded-2xl sm:p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Printable preview</h2>
              <p className="text-sm text-gray-600">The preview below is ready for saving. You can click on the Create Report Card button below.</p>
            </div>
            <div ref={previewRef} className="-mx-3 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2 sm:mx-0">
              <div className="min-w-[850px]">
                {cardType === "nursery" ? (
                  <NurseryReportCard
                    data={formData}
                    studentName={selectedStudent ? `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() : ""}
                    className={selectedClass?.name || formData.className || ""}
                    teacher={formData.teacher}
                    term={formData.term}
                    academicYear={formData.academicYear}
                    schoolName={schoolName}
                    schoolLogo={schoolLogo}
                  />
                ) : (
                  <PrimaryReportCard
                    data={formData}
                    studentName={selectedStudent ? `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`.trim() : ""}
                    className={selectedClass?.name || formData.className || ""}
                    teacher={formData.teacher}
                    term={formData.term}
                    academicYear={formData.academicYear}
                    schoolName={schoolName}
                    schoolLogo={schoolLogo}
                  />
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-400 sm:hidden">Scroll sideways to see the full preview.</p>
          </div>

          <div className="flex justify-center sm:justify-end">
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto">
              {saving ? "Saving..." : "Create report card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}