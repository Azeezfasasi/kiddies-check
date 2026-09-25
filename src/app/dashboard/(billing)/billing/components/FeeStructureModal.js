"use client";

import { useState } from "react";
import { AlertTriangle, Loader, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import ModalFrame, { inputClass, labelClass, primaryButton, secondaryButton } from "./ModalFrame";
import { FEE_ITEM_PRESETS, TERM_LABELS, billingRequest, formatCurrency, toInputDate } from "./billingUtils";

export default function FeeStructureModal({ token, schoolId, academicSession, term, rows, initialClassIds, onClose, onSaved }) {
  // Pre-fill from the first selected class that already has fees.
  const source = rows.find((r) => initialClassIds.includes(r.class._id) && r.structure)?.structure;

  const [classIds, setClassIds] = useState(new Set(initialClassIds));
  const [items, setItems] = useState(
    source?.items?.length ? source.items.map((i) => ({ name: i.name, amount: String(i.amount) })) : [{ name: "Tuition", amount: "" }]
  );
  const [dueDate, setDueDate] = useState(toInputDate(source?.dueDate));
  const [notes, setNotes] = useState(source?.notes || "");
  const [saving, setSaving] = useState(false);

  const total = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const selectedRows = rows.filter((r) => classIds.has(r.class._id));
  const studentCount = selectedRows.reduce((sum, r) => sum + r.studentCount, 0);
  const replacing = selectedRows.filter((r) => r.structure);

  const itemsInvalid =
    items.length === 0 ||
    items.some((i) => !i.name.trim() || i.amount === "" || !Number.isFinite(Number(i.amount)) || Number(i.amount) < 0) ||
    total <= 0;

  const updateItem = (idx, patch) => setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  const removeItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const addItem = (name = "") => setItems((prev) => [...prev, { name, amount: "" }]);

  const toggleClass = (id) =>
    setClassIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const save = async () => {
    setSaving(true);
    try {
      const data = await billingRequest(token, "/api/billing/fee-structures", {
        method: "POST",
        body: JSON.stringify({
          schoolId,
          academicSession,
          term,
          classIds: [...classIds],
          items: items.map((i) => ({ name: i.name.trim(), amount: Number(i.amount) })),
          dueDate: dueDate || null,
          notes,
        }),
      });
      toast.success(data.message);
      onSaved();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const unusedPresets = FEE_ITEM_PRESETS.filter((p) => !items.some((i) => i.name.trim().toLowerCase() === p.toLowerCase()));

  return (
    <ModalFrame
      title="Set Class Fees"
      subtitle={`${TERM_LABELS[term]} · ${academicSession}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className={secondaryButton} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className={primaryButton} onClick={save} disabled={saving || itemsInvalid || classIds.size === 0}>
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            Save & Apply to {classIds.size} Class{classIds.size === 1 ? "" : "es"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div>
            <label className={labelClass}>Fee items</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder="Item name"
                    className={inputClass + " flex-1"}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItem(idx, { amount: e.target.value })}
                    placeholder="Amount (₦)"
                    className={inputClass + " w-36"}
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => addItem()} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800">
              <Plus className="w-4 h-4" /> Add item
            </button>
            {unusedPresets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {unusedPresets.map((p) => (
                  <button
                    key={p}
                    onClick={() => addItem(p)}
                    className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Total per student</span>
            <span className="text-lg font-bold text-blue-800">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Payment due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="e.g. Includes 2nd-term books" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass.replace(" mb-1", "")}>Apply to classes</label>
            <button
              className="text-xs font-semibold text-blue-600"
              onClick={() => setClassIds(classIds.size === rows.length ? new Set() : new Set(rows.map((r) => r.class._id)))}
            >
              {classIds.size === rows.length ? "Clear" : "Select all"}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-gray-100">
            {rows.map((r) => (
              <label key={r.class._id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={classIds.has(r.class._id)} onChange={() => toggleClass(r.class._id)} className="w-4 h-4 rounded border-gray-300" />
                <span className="flex-1 text-gray-800">{r.class.name}</span>
                <span className="text-xs text-gray-400">{r.studentCount} pupils</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {studentCount} student{studentCount === 1 ? "" : "s"} · expected {formatCurrency(total * studentCount)}
          </p>
          {replacing.length > 0 && (
            <div className="flex gap-2 mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Replaces existing fees for {replacing.map((r) => r.class.name).join(", ")}. Existing bills are updated;
                payments and discounts are kept.
              </span>
            </div>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}
