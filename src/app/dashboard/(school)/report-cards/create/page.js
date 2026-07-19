"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import NurseryReportCard from "@/components/dashboard-components/report-cards/NurseryReportCard";
import PrimaryReportCard from "@/components/dashboard-components/report-cards/PrimaryReportCard";

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
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [cardType, setCardType] = useState("nursery");
  const [formData, setFormData] = useState(nurseryTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
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
        const classesRes = await fetch(`/api/teacher/classes?schoolId=${schoolId}`, {
          headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
        });
        const classesData = await classesRes.json();

        if (classesData?.classes) setClasses(classesData.classes);
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
      return;
    }

    const loadStudents = async () => {
      setStudentsLoading(true);
      try {
        const studentsRes = await fetch(`/api/teacher/students?schoolId=${schoolId}&classId=${selectedClassId}`, {
          headers: { "x-user-id": user?._id || localStorage.getItem("userId") || "" },
        });
        const studentsData = await studentsRes.json();

        if (studentsData?.data) {
          setStudents(studentsData.data);
        } else {
          setStudents([]);
        }
        setSelectedStudentId("");
      } catch (error) {
        console.error(error);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [schoolId, selectedClassId, token, user]);

  useEffect(() => {
    if (cardType === "nursery") {
      setFormData((prev) => ({ ...nurseryTemplate, ...prev, ratingData: prev.ratingData?.length ? prev.ratingData : defaultNurseryQuestions.map((q) => ({ ...q, rating: 0 })), generalComments: prev.generalComments?.length ? prev.generalComments : ["", "", ""] }));
    } else {
      setFormData((prev) => ({
        ...primaryTemplate,
        ...prev,
        attendance: prev.attendance?.length ? prev.attendance : [
          { label: "No. of Times School Opened/Activities Held", school: "", sports: "", activities: "" },
          { label: "No. of Times Present", school: "", sports: "", activities: "" },
          { label: "No. of Times Punctual", school: "", sports: "", activities: "" },
        ],
        subjects: prev.subjects?.length ? prev.subjects : defaultPrimarySubjects.map((subject) => ({ subject, continuousAssess: "", testScore: "", total: "" })),
        clubs: prev.clubs?.length ? prev.clubs : [{ organization: "", office: "", contribution: "" }, { organization: "", office: "", contribution: "" }],
      }));
    }
  }, [cardType]);

  const selectedStudent = useMemo(() => students.find((student) => student._id === selectedStudentId) || null, [selectedStudentId, students]);
  const selectedClass = useMemo(() => classes.find((classItem) => classItem._id === selectedClassId) || null, [selectedClassId, classes]);

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
      pdf.save(`${cardType === "nursery" ? "nursery" : "primary"}-report-card-${safeName}.pdf`);
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
      subjects: prev.subjects.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
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

  const schoolName = user?.schoolName || user?.school || localStorage.getItem("schoolName") || "School Name";
  const schoolLogo = user?.schoolLogo || localStorage.getItem("schoolLogo") || "";

  if (loading) {
    return <div className="p-4 text-gray-600 sm:p-6">Loading school data...</div>;
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
              <input value={formData.term || ""} onChange={(e) => handleChange("term", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Academic Year</label>
              <input value={formData.academicYear || ""} onChange={(e) => handleChange("academicYear", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" />
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
                    <input value={row.label} onChange={(e) => { const next = [...formData.attendance]; next[index].label = e.target.value; handleChange("attendance", next); }} className="rounded-lg border border-gray-300 px-3 py-2 sm:col-span-2 md:col-span-1" />
                    <input value={row.school} onChange={(e) => { const next = [...formData.attendance]; next[index].school = e.target.value; handleChange("attendance", next); }} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="School" />
                    <input value={row.sports} onChange={(e) => { const next = [...formData.attendance]; next[index].sports = e.target.value; handleChange("attendance", next); }} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Sports" />
                    <input value={row.activities} onChange={(e) => { const next = [...formData.attendance]; next[index].activities = e.target.value; handleChange("attendance", next); }} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Activities" />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Conduct</h2>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <input value={formData.conduct?.greenNumber || ""} onChange={(e) => handleChange("conduct.greenNumber", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Green number" />
                  <input value={formData.conduct?.redNumber || ""} onChange={(e) => handleChange("conduct.redNumber", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Red number" />
                  <input value={formData.conduct?.greenDeed || ""} onChange={(e) => handleChange("conduct.greenDeed", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Green deed" />
                  <input value={formData.conduct?.redDeed || ""} onChange={(e) => handleChange("conduct.redDeed", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Red deed" />
                  <textarea value={formData.conduct?.comments || ""} onChange={(e) => handleChange("conduct.comments", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 sm:col-span-2" rows={2} placeholder="Comments" />
                  <textarea value={formData.conduct?.remarks || ""} onChange={(e) => handleChange("conduct.remarks", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 sm:col-span-2" rows={2} placeholder="Remarks" />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Physical Development</h2>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <input value={formData.physical?.heightStart || ""} onChange={(e) => handleChange("physical.heightStart", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Height start" />
                  <input value={formData.physical?.heightEnd || ""} onChange={(e) => handleChange("physical.heightEnd", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Height end" />
                  <input value={formData.physical?.weightStart || ""} onChange={(e) => handleChange("physical.weightStart", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Weight start" />
                  <input value={formData.physical?.weightEnd || ""} onChange={(e) => handleChange("physical.weightEnd", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Weight end" />
                  <input value={formData.physical?.illnessDays || ""} onChange={(e) => handleChange("physical.illnessDays", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Illness days" />
                  <input value={formData.physical?.illnessNature || ""} onChange={(e) => handleChange("physical.illnessNature", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Nature of illness" />
                  <input value={formData.physical?.cleanliness || ""} onChange={(e) => handleChange("physical.cleanliness", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Cleanliness" />
                  <input value={formData.physical?.cleanlinessRemarks || ""} onChange={(e) => handleChange("physical.cleanlinessRemarks", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Cleanliness remarks" />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Subject Performance</h2>
                <div className="space-y-2">
                  {formData.subjects?.map((subject, index) => (
                    <div key={`${subject.subject}-${index}`} className="grid gap-2 rounded-lg border border-gray-100 p-2 sm:grid-cols-2 sm:border-0 sm:p-0 md:grid-cols-4">
                      <input value={subject.subject} onChange={(e) => handlePrimarySubjectChange(index, "subject", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 sm:col-span-2 md:col-span-1" />
                      <input value={subject.continuousAssess} onChange={(e) => handlePrimarySubjectChange(index, "continuousAssess", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="CA" />
                      <input value={subject.testScore} onChange={(e) => handlePrimarySubjectChange(index, "testScore", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Test" />
                      <input value={subject.total} onChange={(e) => handlePrimarySubjectChange(index, "total", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Total" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <h2 className="mb-3 text-lg font-semibold text-gray-800">Sports and Clubs</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <input value={formData.sports?.level || ""} onChange={(e) => handleChange("sports.level", e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Sports level" />
                    <textarea value={formData.sports?.comments || ""} onChange={(e) => handleChange("sports.comments", e.target.value)} className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} placeholder="Sports comments" />
                  </div>
                  <div className="space-y-3">
                    {formData.clubs?.map((club, index) => (
                      <div key={`${club.organization}-${index}`} className="rounded-lg border border-gray-200 p-3">
                        <input value={club.organization} onChange={(e) => { const next = [...formData.clubs]; next[index].organization = e.target.value; handleChange("clubs", next); }} className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Organization" />
                        <input value={club.office} onChange={(e) => { const next = [...formData.clubs]; next[index].office = e.target.value; handleChange("clubs", next); }} className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Office held" />
                        <textarea value={club.contribution} onChange={(e) => { const next = [...formData.clubs]; next[index].contribution = e.target.value; handleChange("clubs", next); }} className="w-full rounded-lg border border-gray-300 px-3 py-2" rows={2} placeholder="Contribution" />
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