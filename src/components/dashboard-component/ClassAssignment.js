"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function ClassAssignment() {
  const { user, token } = useAuth();
  const [schoolId, setSchoolId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState(null);
  const [pending, setPending] = useState({});

  useEffect(() => {
    const sid = typeof window !== "undefined" && (localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId"));
    setSchoolId(sid);
  }, []);

  useEffect(() => {
    if (!schoolId || !token) return;
    setLoading(true);
    setError(null);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-user-id": user?._id,
    };

    Promise.all([
      fetch(`/api/teacher/classes?schoolId=${schoolId}`, { headers }),
      fetch(`/api/teacher/staff?schoolId=${schoolId}`, { headers }),
    ])
      .then(async ([classesRes, staffRes]) => {
        const classesJson = await classesRes.json();
        const staffJson = await staffRes.json();
        if (!classesRes.ok) throw new Error(classesJson.error || "Failed to load classes");
        if (!staffRes.ok) throw new Error(staffJson.error || "Failed to load staff");
        setClasses(classesJson.classes || []);
        setStaff(staffJson.staff || []);
        // reset pending map
        setPending({});
      })
      .catch((err) => setError(err.message || String(err)))
      .finally(() => setLoading(false));
  }, [schoolId, token, user?._id]);

  if (!user) return <div>Please login to assign classes.</div>;
  if (!['admin','school-leader','learning-specialist'].includes(user.role)) {
    return <div>Access denied. Only school leaders and learning specialists can assign teachers.</div>;
  }

  const handleAssign = async (classId, teacherId) => {
    // single-save convenience (also used by bulk save)
    setSaving((s) => ({ ...s, [classId]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/teacher/classes/${classId}?schoolId=${schoolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": user._id,
        },
        body: JSON.stringify({ classTeacher: teacherId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update class");
      // update local state
      setClasses((prev) => prev.map((c) => (c._id === classId ? json.class : c)));
      // clear pending for this class
      setPending((p) => {
        const copy = { ...p };
        delete copy[classId];
        return copy;
      });
      toast.success(`Saved assignment for ${json.class.name}`);
      return { success: true, class: json.class };
    } catch (err) {
      const msg = err.message || String(err);
      setError(msg);
      toast.error(msg);
      return { success: false, error: msg };
    } finally {
      setSaving((s) => ({ ...s, [classId]: false }));
    }
  };

  const handleSaveAll = async () => {
    const entries = Object.entries(pending).filter(([, v]) => v !== null && v !== "" );
    if (entries.length === 0) {
      // also allow unassignments
      const unassignEntries = Object.entries(pending).filter(([, v]) => v === null || v === "");
      if (unassignEntries.length === 0) {
        toast('No changes to save');
        return;
      }
    }

    // Prepare list of changed classes (including unassignments)
    const changed = Object.entries(pending);
    if (changed.length === 0) {
      toast('No changes to save');
      return;
    }

    toast.loading('Saving changes...');
    const results = await Promise.all(
      changed.map(async ([classId, teacherId]) => {
        return await handleAssign(classId, teacherId || null);
      })
    );
    toast.dismiss();
    const failed = results.filter(r => !r || !r.success);
    if (failed.length === 0) {
      toast.success('All assignments saved');
    } else {
      toast.error(`${failed.length} assignment(s) failed`);
    }
  };

  return (
    <section className="p-0 md:p-6">
      <h1 className="text-2xl font-bold mb-4">Class Assignment</h1>
      <p className="mb-4 text-sm text-gray-600">Assign or change the class teacher for each class in this school.</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Table for medium+ screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Class</th>
                  <th className="p-2">Current Teacher</th>
                  <th className="p-2">Assign Teacher</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls) => (
                  <tr key={cls._id} className="border-t">
                    <td className="p-2">{cls.name}</td>
                    <td className="p-2">{cls.classTeacher ? `${cls.classTeacher.firstName || ''} ${cls.classTeacher.lastName || ''}`.trim() : 'Unassigned'}</td>
                    <td className="p-2">
                      <select
                        value={pending[cls._id] ?? (cls.classTeacher?._id || "")}
                        onChange={(e) => {
                            const selected = e.target.value;
                            setPending((p) => ({ ...p, [cls._id]: selected }));
                          }}
                        className="px-2 py-1 border rounded"
                      >
                        <option value="">-- Unassigned --</option>
                        {staff.map((s) => (
                          <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-60"
                        disabled={saving[cls._id]}
                        onClick={() => handleAssign(cls._id, pending[cls._id] ?? (cls.classTeacher?._id || null))}
                      >
                        {saving[cls._id] ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Card layout for small screens */}
          <div className="md:hidden space-y-3">
            {classes.map((cls) => (
              <div key={cls._id} className="p-4 bg-white rounded shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-lg">{cls.name}</div>
                    <div className="text-sm text-gray-500">{cls.classTeacher ? `${cls.classTeacher.firstName || ''} ${cls.classTeacher.lastName || ''}`.trim() : 'Unassigned'}</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={pending[cls._id] ?? (cls.classTeacher?._id || "")}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setPending((p) => ({ ...p, [cls._id]: selected }));
                    }}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">-- Unassigned --</option>
                    {staff.map((s) => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.email})</option>
                    ))}
                  </select>

                  <button
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
                    disabled={saving[cls._id]}
                    onClick={() => handleAssign(cls._id, pending[cls._id] ?? (cls.classTeacher?._id || null))}
                  >
                    {saving[cls._id] ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Bulk save actions */}
          <div className="mt-4 flex items-center gap-3">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
              onClick={handleSaveAll}
              disabled={Object.keys(pending).length === 0}
            >
              Save All
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded"
              onClick={() => setPending({})}
              disabled={Object.keys(pending).length === 0}
            >
              Reset Changes
            </button>
          </div>
        </>
      )}
    </section>
  );
}
