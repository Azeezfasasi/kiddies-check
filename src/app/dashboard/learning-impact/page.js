"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Target, GraduationCap, UserCheck, Star, Plus, Loader, X, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import AIChat from "@/components/AIChat";
import DataTable from "./components/DataTable";
import TemplateForm from "./components/TemplateForm";
import LessonObjectiveForm from "./components/LessonObjectiveForm";
import AcademicObjectiveForm from "./components/AcademicObjectiveForm";
import PupilEffortForm from "./components/PupilEffortForm";
import TeacherRatingForm from "./components/TeacherRatingForm";

const TABS = [
  { id: "templates", label: "Lesson Templates", icon: BookOpen },
  { id: "lesson-objectives", label: "Lesson Objectives", icon: Target },
  { id: "academic-objectives", label: "Academic Objectives", icon: GraduationCap },
  { id: "pupil-efforts", label: "Pupil Efforts", icon: UserCheck },
  { id: "teacher-ratings", label: "Teacher Ratings", icon: Star },
];

function SummaryCard({ icon, label, value, subtext, color }) {
  const colors = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    amber: "text-amber-600 bg-amber-50",
    purple: "text-purple-600 bg-purple-50",
  };
  const [textColor] = colors[color].split(" ");

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className={`flex items-center gap-2 mb-2 ${textColor}`}>
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );
}

export default function LearningImpactPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("templates");
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");

  const [templates, setTemplates] = useState([]);
  const [lessonObjectiveRatings, setLessonObjectiveRatings] = useState([]);
  const [academicObjectiveRatings, setAcademicObjectiveRatings] = useState([]);
  const [pupilEfforts, setPupilEfforts] = useState([]);
  const [teacherRatings, setTeacherRatings] = useState([]);
  const [summary, setSummary] = useState(null);

  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const sid = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const uid = localStorage.getItem("userId");
    const role = localStorage.getItem("userRole");

    if (!token || !sid || !uid) {
      router.push("/login");
      return;
    }

    setSchoolId(sid);
    setUserId(uid);
    setUserRole(role);
    fetchAllData(sid, uid);
  }, [router]);

  const fetchAllData = async (sid, uid) => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTemplates(sid, uid),
        fetchLessonObjectives(sid, uid),
        fetchAcademicObjectives(sid, uid),
        fetchPupilEfforts(sid, uid),
        fetchTeacherRatings(sid, uid),
        fetchSummary(sid, uid),
        fetchReferenceData(sid, uid),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load some data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async (sid, uid) => {
    const headers = { "x-user-id": uid };
    const [classesRes, studentsRes, subjectsRes] = await Promise.all([
      fetch(`/api/teacher/classes?schoolId=${sid}`, { headers }),
      fetch(`/api/teacher/students?schoolId=${sid}`, { headers }),
      fetch(`/api/teacher/subjects?schoolId=${sid}`, { headers }),
    ]);

    if (classesRes.ok) {
      const data = await classesRes.json();
      setClasses(data.classes || []);
    }
    if (studentsRes.ok) {
      const data = await studentsRes.json();
      setStudents(data.data || []);
    }
    if (subjectsRes.ok) {
      const data = await subjectsRes.json();
      setSubjects(data.subjects || []);
    }

    try {
      const usersRes = await fetch(`/api/teacher/staff?schoolId=${sid}`, { headers });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setTeachers(data.staff || []);
      }
    } catch (e) {
      setTeachers([]);
    }
  };

  const fetchTemplates = async (sid, uid) => {
    const res = await fetch(`/api/learning-impact/lesson-templates?schoolId=${sid}`, { headers: { "x-user-id": uid } });
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates || []);
    }
  };

  const fetchLessonObjectives = async (sid, uid) => {
    const res = await fetch(`/api/learning-impact/lesson-objectives?schoolId=${sid}`, { headers: { "x-user-id": uid } });
    if (res.ok) {
      const data = await res.json();
      setLessonObjectiveRatings(data.ratings || []);
    }
  };

  const fetchAcademicObjectives = async (sid, uid) => {
    const res = await fetch(`/api/learning-impact/academic-objectives?schoolId=${sid}`, { headers: { "x-user-id": uid } });
    if (res.ok) {
      const data = await res.json();
      setAcademicObjectiveRatings(data.ratings || []);
    }
  };

  const fetchPupilEfforts = async (sid, uid) => {
    const res = await fetch(`/api/learning-impact/pupil-efforts?schoolId=${sid}`, { headers: { "x-user-id": uid } });
    if (res.ok) {
      const data = await res.json();
      setPupilEfforts(data.efforts || []);
    }
  };

  const fetchTeacherRatings = async (sid, uid) => {
    const res = await fetch(`/api/learning-impact/teacher-ratings?schoolId=${sid}`, { headers: { "x-user-id": uid } });
    if (res.ok) {
      const data = await res.json();
      setTeacherRatings(data.ratings || []);
    }
  };

  const fetchSummary = async (sid, uid) => {
    const res = await fetch(`/api/learning-impact/summary?schoolId=${sid}`, { headers: { "x-user-id": uid } });
    if (res.ok) {
      const data = await res.json();
      setSummary(data.summary);
    }
  };

  const handleSave = async (type, formData) => {
    try {
      const endpoints = {
        templates: "/api/learning-impact/lesson-templates",
        "lesson-objectives": "/api/learning-impact/lesson-objectives",
        "academic-objectives": "/api/learning-impact/academic-objectives",
        "pupil-efforts": "/api/learning-impact/pupil-efforts",
        "teacher-ratings": "/api/learning-impact/teacher-ratings",
      };

      const idFields = {
        templates: "templateId",
        "lesson-objectives": "ratingId",
        "academic-objectives": "ratingId",
        "pupil-efforts": "effortId",
        "teacher-ratings": "ratingId",
      };

      const method = editingItem ? "PUT" : "POST";
      const body = { ...formData, schoolId };
      if (editingItem) {
        body[idFields[type]] = editingItem._id;
      }

      const res = await fetch(endpoints[type], {
        method,
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success(editingItem ? "Updated successfully" : "Created successfully");
      setShowForm(false);
      setEditingItem(null);
      fetchAllData(schoolId, userId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const endpoints = {
        templates: `/api/learning-impact/lesson-templates?templateId=${id}&schoolId=${schoolId}`,
        "lesson-objectives": `/api/learning-impact/lesson-objectives?ratingId=${id}&schoolId=${schoolId}`,
        "academic-objectives": `/api/learning-impact/academic-objectives?ratingId=${id}&schoolId=${schoolId}`,
        "pupil-efforts": `/api/learning-impact/pupil-efforts?effortId=${id}&schoolId=${schoolId}`,
        "teacher-ratings": `/api/learning-impact/teacher-ratings?ratingId=${id}&schoolId=${schoolId}`,
      };

      const res = await fetch(endpoints[type], {
        method: "DELETE",
        headers: { "x-user-id": userId },
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Deleted successfully");
      fetchAllData(schoolId, userId);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading learning impact data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Learning Impact Data</h1>
            <p className="text-gray-600 mt-1">Track and evaluate teaching effectiveness and pupil progress</p>
          </div>
          <button
            onClick={() => setShowAIChat(!showAIChat)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            {showAIChat ? "Close AI Assistant" : "AI Improvement Assistant"}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <SummaryCard icon={<Target className="w-5 h-5" />} label="Lesson Objectives" value={summary.lessonObjectives?.averageRating?.toFixed(1) || "0.0"} subtext={`${summary.lessonObjectives?.totalRatings || 0} ratings`} color="blue" />
            <SummaryCard icon={<GraduationCap className="w-5 h-5" />} label="Academic Progress" value={summary.academicObjectives?.averageProgress?.toFixed(1) || "0.0"} subtext={`${summary.academicObjectives?.totalRatings || 0} ratings`} color="green" />
            <SummaryCard icon={<UserCheck className="w-5 h-5" />} label="Pupil Effort" value={summary.pupilEfforts?.averageEffort?.toFixed(1) || "0.0"} subtext={`${summary.pupilEfforts?.totalSubmissions || 0} submissions`} color="amber" />
            <SummaryCard icon={<Star className="w-5 h-5" />} label="Teacher Ratings" value={summary.teacherRatings?.averageScore?.toFixed(1) || "0.0"} subtext={`${summary.teacherRatings?.totalRatings || 0} ratings`} color="purple" />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto border-b">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setShowForm(false); setEditingItem(null); }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-800"}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-4 md:p-6">
            {!showForm && (
              <button
                onClick={() => { setEditingItem(null); setShowForm(true); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New {activeTab === "templates" ? "Template" : activeTab === "pupil-efforts" ? "Effort Record" : "Rating"}
              </button>
            )}

            {showForm && activeTab === "templates" && (
              <TemplateForm onSubmit={(data) => handleSave("templates", data)} onCancel={() => { setShowForm(false); setEditingItem(null); }} editingItem={editingItem} />
            )}
            {showForm && activeTab === "lesson-objectives" && (
              <LessonObjectiveForm onSubmit={(data) => handleSave("lesson-objectives", data)} onCancel={() => { setShowForm(false); setEditingItem(null); }} editingItem={editingItem} teachers={teachers} classes={classes} subjects={subjects} />
            )}
            {showForm && activeTab === "academic-objectives" && (
              <AcademicObjectiveForm onSubmit={(data) => handleSave("academic-objectives", data)} onCancel={() => { setShowForm(false); setEditingItem(null); }} editingItem={editingItem} students={students} classes={classes} subjects={subjects} />
            )}
            {showForm && activeTab === "pupil-efforts" && (
              <PupilEffortForm onSubmit={(data) => handleSave("pupil-efforts", data)} onCancel={() => { setShowForm(false); setEditingItem(null); }} editingItem={editingItem} students={students} classes={classes} subjects={subjects} />
            )}
            {showForm && activeTab === "teacher-ratings" && (
              <TeacherRatingForm onSubmit={(data) => handleSave("teacher-ratings", data)} onCancel={() => { setShowForm(false); setEditingItem(null); }} editingItem={editingItem} teachers={teachers} classes={classes} subjects={subjects} />
            )}

            {!showForm && activeTab === "templates" && (
              <DataTable columns={["Name", "Frequency", "Criteria Count"]} data={templates.map((t) => ({ _id: t._id, cells: [t.name, t.frequency, t.criteria?.length || 0] }))} onEdit={(item) => { const template = templates.find((t) => t._id === item._id); setEditingItem(template); setShowForm(true); }} onDelete={(id) => handleDelete("templates", id)} />
            )}
            {!showForm && activeTab === "lesson-objectives" && (
              <DataTable columns={["Teacher", "Class", "Subject", "Week", "Rating"]} data={lessonObjectiveRatings.map((r) => ({ _id: r._id, cells: [`${r.teacher?.firstName || ""} ${r.teacher?.lastName || ""}`, r.class?.name || "-", r.subject?.name || "-", r.week, <StarRating key={r._id} rating={r.overallRating} />] }))} onEdit={(item) => { const rating = lessonObjectiveRatings.find((r) => r._id === item._id); setEditingItem(rating); setShowForm(true); }} onDelete={(id) => handleDelete("lesson-objectives", id)} />
            )}
            {!showForm && activeTab === "academic-objectives" && (
              <DataTable columns={["Student", "Class", "Subject", "Term", "Progress"]} data={academicObjectiveRatings.map((r) => ({ _id: r._id, cells: [`${r.student?.firstName || ""} ${r.student?.lastName || ""}`, r.class?.name || "-", r.subject?.name || "-", r.term, <StarRating key={r._id} rating={r.overallProgress} />] }))} onEdit={(item) => { const rating = academicObjectiveRatings.find((r) => r._id === item._id); setEditingItem(rating); setShowForm(true); }} onDelete={(id) => handleDelete("academic-objectives", id)} />
            )}
            {!showForm && activeTab === "pupil-efforts" && (
              <DataTable columns={["Student", "Class", "Week", "Effort"]} data={pupilEfforts.map((e) => ({ _id: e._id, cells: [`${e.student?.firstName || ""} ${e.student?.lastName || ""}`, e.class?.name || "-", e.week, <StarRating key={e._id} rating={e.overallEffort} />] }))} onEdit={(item) => { const effort = pupilEfforts.find((e) => e._id === item._id); setEditingItem(effort); setShowForm(true); }} onDelete={(id) => handleDelete("pupil-efforts", id)} />
            )}
            {!showForm && activeTab === "teacher-ratings" && (
              <DataTable columns={["Teacher", "Type", "Score", "Date"]} data={teacherRatings.map((r) => ({ _id: r._id, cells: [`${r.teacher?.firstName || ""} ${r.teacher?.lastName || ""}`, r.ratingType, <StarRating key={r._id} rating={r.overallScore} />, new Date(r.date).toLocaleDateString()] }))} onEdit={(item) => { const rating = teacherRatings.find((r) => r._id === item._id); setEditingItem(rating); setShowForm(true); }} onDelete={(id) => handleDelete("teacher-ratings", id)} />
            )}
          </div>
        </div>
      </div>

      {/* AI Chat Sidebar */}
      {showAIChat && (
        <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-800">AI Improvement Assistant</h3>
            <button onClick={() => setShowAIChat(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChat
              userRole={userRole}
              schoolContext={{ schoolName: "Your School" }}
              placeholder="Ask about improvement plans based on the learning impact data..."
              title="Learning Impact AI"
              maxHeight="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}

