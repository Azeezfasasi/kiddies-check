"use client";

import { Edit2, Trash2 } from "lucide-react";

export default function DataTable({ columns, data, onEdit, onDelete }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No data available. Click Add New to create.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((row) => (
            <tr key={row._id} className="hover:bg-gray-50">
              {row.cells.map((cell, i) => (
                <td key={i} className="px-4 py-3 text-sm text-gray-800">
                  {cell}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(row)} className="text-blue-600 hover:text-blue-800" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(row._id)} className="text-red-600 hover:text-red-800" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

