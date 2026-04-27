"use client";

export function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        required={required}
      >
        <option value="">{`Select ${label}`}</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {opt.firstName ? `${opt.firstName} ${opt.lastName}` : opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function NumberField({ label, value, onChange, min, max }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        min={min}
        max={max}
      />
    </div>
  );
}

export function DateField({ label, value, onChange, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        required={required}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        rows={rows}
      />
    </div>
  );
}

export function RatingSelect({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : "")}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="">Select...</option>
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}

export function FormButtons({ onCancel, isEdit }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        {isEdit ? "Update" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
      >
        Cancel
      </button>
    </div>
  );
}
