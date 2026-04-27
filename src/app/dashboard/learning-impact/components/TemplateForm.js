"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FormButtons } from "./FormInputs";

export default function TemplateForm({ onSubmit, onCancel, editingItem }) {
  const [formData, setFormData] = useState({
    name: editingItem?.name || "",
    description: editingItem?.description || "",
    frequency: editingItem?.frequency || "daily",
    criteria: editingItem?.criteria || [{ name: "", maxScore: 5 }],
  });

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [...formData.criteria, { name: "", maxScore: 5 }],
    });
  };

  const updateCriterion = (index, field, value) => {
    const updated = [...formData.criteria];
    updated[index][field] = field === "maxScore" ? parseInt(value) || 1 : value;
    setFormData({ ...formData, criteria: updated });
  };

  const removeCriterion = (index) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating Criteria</label>
        {formData.criteria.map((criterion, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Criterion name"
              value={criterion.name}
              onChange={(e) => updateCriterion(index, "name", e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="number"
              placeholder="Max"
              value={criterion.maxScore}
              onChange={(e) => updateCriterion(index, "maxScore", e.target.value)}
              className="w-20 px-3 py-2 border rounded-lg"
              min="1"
              max="10"
            />
            <button type="button" onClick={() => removeCriterion(index)} className="text-red-500 hover:text-red-700 px-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addCriterion} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          + Add Criterion
        </button>
      </div>
      <FormButtons onCancel={onCancel} isEdit={!!editingItem} />
    </form>
  );
}

