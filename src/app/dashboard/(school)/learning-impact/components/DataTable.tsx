"use client";

import { Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function DataTable({ columns, data, onEdit, onDelete }) {
  const { isAdmin, isSchoolLeader, isLearningSpecialist } = useAuth();
  const canManage = isAdmin || isSchoolLeader || isLearningSpecialist;

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No data available. Click Add New to create.</p>
      </div>
    );
  }

  return (
    // desktop view
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {col}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row) => (
              <tr key={row._id} className="hover:bg-gray-50">
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-4 py-3 text-sm text-gray-800 align-top">
                    {cell}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    {canManage && (
                      <button onClick={() => onEdit(row)} className="text-blue-600 hover:text-blue-800" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canManage && (
                      <button onClick={() => onDelete(row._id)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile view */}
      <div className="md:hidden p-3 space-y-3">
        {data.map((row) => (
          <div key={row._id} className="rounded-2xl border border-gray-200 bg-white p-4">
            {row.cells.map((cell, i) => (
              <div key={i} className="mb-2 flex flex-col gap-1 text-sm text-gray-800 last:mb-0">
                <span className="font-semibold text-[#D97706]">{columns[i]}</span>
                <span className="break-words">{cell}</span>
              </div>
            ))}
            {canManage && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onEdit(row)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(row._id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}