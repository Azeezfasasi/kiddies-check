"use client";

import { useState } from "react";
import { SelectField, NumberField, DateField, RatingSelect, FormButtons } from "./FormInputs";

const TEACHER_DIMENSIONS = [
  { key: "lesson_planning", label: "Lesson Planning" },
  { key: "instructional_delivery", label: "Instructional Delivery" },
  { key: "classroom_management", label: "Classroom Management" },
  { key: "student_engagement", label: "Student Engagement" },
  { key: "assessment_practices", label: "Assessment Practices" },
  { key: "differentiation", label: "Differentiation" },
  { key: "professionalism", label: "Professionalism" },
  { key: "communication", label: "Communication" },
  { key: "subject_knowledge", label: "Subject Knowledge" },
  { key: "use_of_resources", label: "Use of Resources" },
  { key: "feedback_quality", label: "Feedback Quality" },
  { key: "pupil_progress", label: "Pupil Progress" },
];

export default function TeacherRatingForm({ onSubmit, onCancel, editingItem, teachers, classes, subjects }) {
  const [formData, setFormData] = useState({
    teacherId: editingItem?.teacher?._id || "",
    classId: editingItem?.class?._id || "",
    subjectId: editingItem?.subject?._id || "",
    ratingType: editingItem?.ratingType || "formal",
    week: editingItem?.week || 1,
    year: editingItem?.year || new Date().getFullYear(),
    date: editingItem?.date ? editingItem.date.split("T")[0] : new Date().toISOString().split("T")[0],
    dimensions: editingItem?.dimensions || TEACHER_DIMENSIONS.map((dim) => ({ dimension: dim.key, score: 3, comment: "" })),
    overallScore: editingItem?.overallScore || "",
    overallComment: editingItem?.overallComment || "",
    strengths: editingItem?.strengths?.join(", ") || "",
    developmentAreas: editingItem?.developmentAreas?.join(", ") || "",
    actionPlan: editingItem?.actionPlan || "",
  });

  const updateDimension = (index, field, value) => {
    const updated = [...formData.dimensions];
    updated[index][field] = field === "score" ? parseInt(value) : value;
    setFormData({ ...formData, dimensions: updated });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectField label="Teacher" value={formData.teacherId} onChange={(v) => setFormData({ ...formData, teacherId: v })} options={teachers} required />
        <SelectField label="Class (Optional)" value={formData.classId} onChange={(v) => setFormData({ ...formData, classId: v })} options={classes} />
        <SelectField label="Subject (Optional)" value={formData.subjectId} onChange={(v) => setFormData({ ...formData, subjectId: v })} options={subjects} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rating Type</label>
          <select value={formData.ratingType} onChange={(e) => setFormData({ ...formData, ratingType: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            <option value="formal">Formal</option>
            <option value="informal">Informal</option>
            <option value="peer">Peer</option>
            <option value="self">Self</option>
            <option value="observation">Observation</option>
          </select>
        </div>
        <NumberField label="Week" value={formData.week} onChange={(v) => setFormData({ ...formData, week: v })} min={1} max={52} />
        <NumberField label="Year" value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} />
        <DateField label="Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating Dimensions</label>
        {formData.dimensions.map((dim, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded-lg">
            <span className="flex-1 text-sm font-medium">{TEACHER_DIMENSIONS.find((d) => d.key === dim.dimension)?.label || dim.dimension}</span>
            <select value={dim.score} onChange={(e) => updateDimension(index, "score", e.target.value)} className="w-20 px-3 py-2 border rounded-lg">
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input type="text" placeholder="Comment" value={dim.comment} onChange={(e) => updateDimension(index, "comment", e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingSelect label="Overall Score" value={formData.overallScore} onChange={(v) => setFormData({ ...formData, overallScore: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comment</label>
          <input type="text" value={formData.overallComment} onChange={(e) => setFormData({ ...formData, overallComment: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strengths (comma separated)</label>
          <input type="text" value={formData.strengths} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. lesson planning, engagement" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Development Areas (comma separated)</label>
          <input type="text" value={formData.developmentAreas} onChange={(e) => setFormData({ ...formData, developmentAreas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. differentiation, assessment" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Action Plan</label>
        <textarea value={formData.actionPlan} onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} placeholder="Describe the improvement action plan..." />
      </div>
      <FormButtons onCancel={onCancel} isEdit={!!editingItem} />
    </form>
  );
}

