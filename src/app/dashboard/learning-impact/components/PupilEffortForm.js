"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SelectField, NumberField, DateField, RatingSelect, FormButtons } from "./FormInputs";

const EFFORT_CATEGORIES = [
  { key: "participation", label: "Participation" },
  { key: "homework_completion", label: "Homework Completion" },
  { key: "classwork_completion", label: "Classwork Completion" },
  { key: "behavior", label: "Behavior" },
  { key: "collaboration", label: "Collaboration" },
  { key: "independent_work", label: "Independent Work" },
  { key: "listening_skills", label: "Listening Skills" },
  { key: "organization", label: "Organization" },
  { key: "perseverance", label: "Perseverance" },
  { key: "self_reflection", label: "Self Reflection" },
];

export default function PupilEffortForm({ onSubmit, onCancel, editingItem, students, classes, subjects }) {
  const [formData, setFormData] = useState({
    studentId: editingItem?.student?._id || "",
    classId: editingItem?.class?._id || "",
    subjectId: editingItem?.subject?._id || "",
    week: editingItem?.week || 1,
    year: editingItem?.year || new Date().getFullYear(),
    date: editingItem?.date ? editingItem.date.split("T")[0] : new Date().toISOString().split("T")[0],
    efforts: editingItem?.efforts || EFFORT_CATEGORIES.map((cat) => ({ category: cat.key, rating: 3, comment: "" })),
    overallEffort: editingItem?.overallEffort || "",
    overallComment: editingItem?.overallComment || "",
    improvementAreas: editingItem?.improvementAreas?.join(", ") || "",
    strengths: editingItem?.strengths?.join(", ") || "",
  });

  const updateEffort = (index, field, value) => {
    const updated = [...formData.efforts];
    updated[index][field] = field === "rating" ? parseInt(value) : value;
    setFormData({ ...formData, efforts: updated });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectField label="Student" value={formData.studentId} onChange={(v) => setFormData({ ...formData, studentId: v })} options={students} required />
        <SelectField label="Class" value={formData.classId} onChange={(v) => setFormData({ ...formData, classId: v })} options={classes} required />
        <SelectField label="Subject (Optional)" value={formData.subjectId} onChange={(v) => setFormData({ ...formData, subjectId: v })} options={subjects} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NumberField label="Week" value={formData.week} onChange={(v) => setFormData({ ...formData, week: v })} min={1} max={52} />
        <NumberField label="Year" value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} />
        <DateField label="Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Effort Categories</label>
        {formData.efforts.map((effort, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center bg-gray-50 p-2 rounded-lg">
            <span className="flex-1 text-sm font-medium">{EFFORT_CATEGORIES.find((c) => c.key === effort.category)?.label || effort.category}</span>
            <select value={effort.rating} onChange={(e) => updateEffort(index, "rating", e.target.value)} className="w-20 px-3 py-2 border rounded-lg">
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <input type="text" placeholder="Comment" value={effort.comment} onChange={(e) => updateEffort(index, "comment", e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingSelect label="Overall Effort" value={formData.overallEffort} onChange={(v) => setFormData({ ...formData, overallEffort: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overall Comment</label>
          <input type="text" value={formData.overallComment} onChange={(e) => setFormData({ ...formData, overallComment: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strengths (comma separated)</label>
          <input type="text" value={formData.strengths} onChange={(e) => setFormData({ ...formData, strengths: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. teamwork, creativity" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Improvement Areas (comma separated)</label>
          <input type="text" value={formData.improvementAreas} onChange={(e) => setFormData({ ...formData, improvementAreas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. focus, time management" />
        </div>
      </div>
      <FormButtons onCancel={onCancel} isEdit={!!editingItem} />
    </form>
  );
}

