"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SelectField, NumberField, DateField, RatingSelect, FormButtons } from "./FormInputs";

export default function LessonObjectiveForm({ onSubmit, onCancel, editingItem, teachers, classes, subjects }) {
  const [formData, setFormData] = useState({
    teacherId: editingItem?.teacher?._id || "",
    classId: editingItem?.class?._id || "",
    subjectId: editingItem?.subject?._id || "",
    week: editingItem?.week || 1,
    year: editingItem?.year || new Date().getFullYear(),
    date: editingItem?.date ? editingItem.date.split("T")[0] : new Date().toISOString().split("T")[0],
    objectives: editingItem?.objectives || [{ objective: "", achieved: false, rating: 3, evidence: "" }],
    overallRating: editingItem?.overallRating || "",
    overallComment: editingItem?.overallComment || "",
  });

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, { objective: "", achieved: false, rating: 3, evidence: "" }],
    });
  };

  const updateObjective = (index, field, value) => {
    const updated = [...formData.objectives];
    updated[index][field] = field === "rating" ? parseInt(value) : value;
    setFormData({ ...formData, objectives: updated });
  };

  const removeObjective = (index) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SelectField label="Teacher" value={formData.teacherId} onChange={(v) => setFormData({ ...formData, teacherId: v })} options={teachers} required />
        <SelectField label="Class" value={formData.classId} onChange={(v) => setFormData({ ...formData, classId: v })} options={classes} required />
        <SelectField label="Subject" value={formData.subjectId} onChange={(v) => setFormData({ ...formData, subjectId: v })} options={subjects} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NumberField label="Week" value={formData.week} onChange={(v) => setFormData({ ...formData, week: v })} min={1} max={52} />
        <NumberField label="Year" value={formData.year} onChange={(v) => setFormData({ ...formData, year: v })} />
        <DateField label="Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Objectives</label>
        {formData.objectives.map((obj, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Objective"
                value={obj.objective}
                onChange={(e) => updateObjective(index, "objective", e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                required
              />
              <select value={obj.rating} onChange={(e) => updateObjective(index, "rating", e.target.value)} className="w-20 px-3 py-2 border rounded-lg">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button type="button" onClick={() => removeObjective(index)} className="text-red-500 hover:text-red-700 px-2">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={obj.achieved} onChange={(e) => updateObjective(index, "achieved", e.target.checked)} className="rounded" />
                Achieved
              </label>
              <input type="text" placeholder="Evidence" value={obj.evidence} onChange={(e) => updateObjective(index, "evidence", e.target.value)} className="flex-1 px-3 py-1 border rounded-lg text-sm" />
            </div>
          </div>
        ))}
        <button type="button" onClick={addObjective} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          + Add Objective
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingSelect label="Overall Rating" value={formData.overallRating} onChange={(v) => setFormData({ ...formData, overallRating: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
          <input type="text" value={formData.overallComment} onChange={(e) => setFormData({ ...formData, overallComment: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      <FormButtons onCancel={onCancel} isEdit={!!editingItem} />
    </form>
  );
}

