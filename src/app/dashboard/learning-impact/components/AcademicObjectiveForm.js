"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { SelectField, DateField, RatingSelect, FormButtons } from "./FormInputs";

export default function AcademicObjectiveForm({ onSubmit, onCancel, editingItem, students, classes, subjects }) {
  const [formData, setFormData] = useState({
    studentId: editingItem?.student?._id || "",
    classId: editingItem?.class?._id || "",
    subjectId: editingItem?.subject?._id || "",
    term: editingItem?.term || "first",
    year: editingItem?.year || new Date().getFullYear(),
    date: editingItem?.date ? editingItem.date.split("T")[0] : new Date().toISOString().split("T")[0],
    objectives: editingItem?.objectives || [{ objective: "", curriculumArea: "", targetLevel: "at", achievedLevel: "not-assessed", progressRating: 3, evidence: "" }],
    overallProgress: editingItem?.overallProgress || "",
    teacherComment: editingItem?.teacherComment || "",
    nextSteps: editingItem?.nextSteps || "",
  });

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, { objective: "", curriculumArea: "", targetLevel: "at", achievedLevel: "not-assessed", progressRating: 3, evidence: "" }],
    });
  };

  const updateObjective = (index, field, value) => {
    const updated = [...formData.objectives];
    updated[index][field] = field === "progressRating" ? parseInt(value) : value;
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
        <SelectField label="Student" value={formData.studentId} onChange={(v) => setFormData({ ...formData, studentId: v })} options={students} required />
        <SelectField label="Class" value={formData.classId} onChange={(v) => setFormData({ ...formData, classId: v })} options={classes} required />
        <SelectField label="Subject" value={formData.subjectId} onChange={(v) => setFormData({ ...formData, subjectId: v })} options={subjects} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
          <select value={formData.term} onChange={(e) => setFormData({ ...formData, term: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
            <option value="first">First</option>
            <option value="second">Second</option>
            <option value="third">Third</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <DateField label="Date" value={formData.date} onChange={(v) => setFormData({ ...formData, date: v })} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Academic Objectives</label>
        {formData.objectives.map((obj, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 space-y-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Objective" value={obj.objective} onChange={(e) => updateObjective(index, "objective", e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" required />
              <select value={obj.progressRating} onChange={(e) => updateObjective(index, "progressRating", e.target.value)} className="w-20 px-3 py-2 border rounded-lg">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button type="button" onClick={() => removeObjective(index)} className="text-red-500 hover:text-red-700 px-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="Curriculum Area" value={obj.curriculumArea} onChange={(e) => updateObjective(index, "curriculumArea", e.target.value)} className="px-3 py-1 border rounded-lg text-sm" />
              <input type="text" placeholder="Evidence" value={obj.evidence} onChange={(e) => updateObjective(index, "evidence", e.target.value)} className="px-3 py-1 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={obj.targetLevel} onChange={(e) => updateObjective(index, "targetLevel", e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
                <option value="below">Below</option>
                <option value="at">At</option>
                <option value="above">Above</option>
                <option value="exceeding">Exceeding</option>
              </select>
              <select value={obj.achievedLevel} onChange={(e) => updateObjective(index, "achievedLevel", e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
                <option value="not-assessed">Not Assessed</option>
                <option value="below">Below</option>
                <option value="at">At</option>
                <option value="above">Above</option>
                <option value="exceeding">Exceeding</option>
              </select>
            </div>
          </div>
        ))}
        <button type="button" onClick={addObjective} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Objective</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RatingSelect label="Overall Progress" value={formData.overallProgress} onChange={(v) => setFormData({ ...formData, overallProgress: v })} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Next Steps</label>
          <input type="text" value={formData.nextSteps} onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Comment</label>
        <textarea value={formData.teacherComment} onChange={(e) => setFormData({ ...formData, teacherComment: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
      </div>
      <FormButtons onCancel={onCancel} isEdit={!!editingItem} />
    </form>
  );
}

