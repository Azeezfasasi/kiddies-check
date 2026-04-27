"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Loader,
  Calendar,
  CheckCircle,
  XCircle,
  Sun,
  Snowflake,
  Leaf,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

const TERM_ICONS = {
  first: Sun,
  second: Leaf,
  third: Snowflake,
};

const TERM_LABELS = {
  first: "First Term",
  second: "Second Term",
  third: "Third Term",
};

export default function AcademicCalendarPage() {
  const router = useRouter();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [token, setToken] = useState("");

  const [formData, setFormData] = useState({
    session: "",
    term: "first",
    startDate: "",
    endDate: "",
    isCurrent: false,
    holidays: [],
  });

  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: "",
    type: "public",
    description: "",
  });

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    setToken(t);
    fetchTerms(t);
  }, [router]);

  const fetchTerms = async (t) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/academic-calendar", {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        setTerms(data.terms || []);
      } else {
        toast.error(data.message || "Failed to load terms");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load academic calendar");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      session: "",
      term: "first",
      startDate: "",
      endDate: "",
      isCurrent: false,
      holidays: [],
    });
    setHolidayForm({ name: "", date: "", type: "public", description: "" });
  };

  const handleOpenModal = (term = null) => {
    if (term) {
      setEditingTerm(term);
      setFormData({
        session: term.session,
        term: term.term,
        startDate: term.startDate
          ? new Date(term.startDate).toISOString().split("T")[0]
          : "",
        endDate: term.endDate
          ? new Date(term.endDate).toISOString().split("T")[0]
          : "",
        isCurrent: term.isCurrent,
        holidays: term.holidays || [],
      });
    } else {
      setEditingTerm(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleAddHoliday = () => {
    if (!holidayForm.name || !holidayForm.date) {
      toast.error("Holiday name and date are required");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      holidays: [...prev.holidays, { ...holidayForm }],
    }));
    setHolidayForm({ name: "", date: "", type: "public", description: "" });
  };

  const handleRemoveHoliday = (index) => {
    setFormData((prev) => ({
      ...prev,
      holidays: prev.holidays.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTerm
        ? `/api/admin/academic-calendar/${editingTerm._id}`
        : "/api/admin/academic-calendar";
      const method = editingTerm ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowModal(false);
        resetForm();
        fetchTerms(token);
      } else {
        toast.error(data.message || "Failed to save term");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/admin/academic-calendar/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Term deleted");
        setDeleteConfirm(null);
        fetchTerms(token);
      } else {
        toast.error(data.message || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      const res = await fetch(`/api/admin/academic-calendar/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Term set as current");
        fetchTerms(token);
      } else {
        toast.error(data.message || "Failed to set current term");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    }
  };

  const sessionsMap = terms.reduce((acc, term) => {
    if (!acc[term.session]) acc[term.session] = [];
    acc[term.session].push(term);
    return acc;
  }, {});

  const sortedSessions = Object.keys(sessionsMap).sort().reverse();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading academic calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-0 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Academic Calendar
            </h1>
            <p className="text-gray-600 mt-1">
              Manage academic sessions, terms, and public holidays globally
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Add Term
          </button>
        </div>

        {sortedSessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No academic terms yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first academic term to get started
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Term
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedSessions.map((session) => (
              <div
                key={session}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                  <h2 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Academic Session: {session}
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessionsMap[session]
                    .sort((a, b) => {
                      const order = { first: 1, second: 2, third: 3 };
                      return order[a.term] - order[b.term];
                    })
                    .map((term) => {
                      const TermIcon = TERM_ICONS[term.term] || Clock;
                      const isCurrent = term.isCurrent;
                      const cardBorder = isCurrent
                        ? "border-blue-300 bg-blue-50/50 ring-1 ring-blue-200"
                        : "border-gray-200 bg-white";
                      const iconBg = isCurrent
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600";
                      return (
                        <div
                          key={term._id}
                          className={`rounded-lg border p-5 transition-shadow hover:shadow-md ${cardBorder}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${iconBg}`}>
                                <TermIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">
                                  {TERM_LABELS[term.term]}
                                </h3>
                                {isCurrent && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full mt-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Current Term
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {!isCurrent && (
                                <button
                                  onClick={() => handleSetCurrent(term._id)}
                                  title="Set as current term"
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenModal(term)}
                                title="Edit"
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(term._id)}
                                title="Delete"
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Start Date:</span>
                              <span className="font-medium text-gray-800">
                                {new Date(term.startDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">End Date:</span>
                              <span className="font-medium text-gray-800">
                                {new Date(term.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Duration:</span>
                              <span className="font-medium text-gray-800">
                                {Math.ceil(
                                  (new Date(term.endDate) -
                                    new Date(term.startDate)) /
                                    (1000 * 60 * 60 * 24)
                                )}{" "}
                                days
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Status:</span>
                              <span
                                className={`font-medium ${
                                  term.isActive
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {term.isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>

                          {term.holidays && term.holidays.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Holidays ({term.holidays.length})
                              </p>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                                {term.holidays.map((h, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                                  >
                                    <span className="font-medium text-gray-700">
                                      {h.name}
                                    </span>
                                    <span className="text-gray-500">
                                      {new Date(h.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingTerm ? "Edit Term" : "Add Academic Term"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., 2026/2027"
                    value={formData.session}
                    onChange={(e) =>
                      setFormData({ ...formData, session: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) =>
                      setFormData({ ...formData, term: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="third">Third Term</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={formData.isCurrent}
                  onChange={(e) =>
                    setFormData({ ...formData, isCurrent: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isCurrent"
                  className="text-sm font-medium text-gray-700"
                >
                  Set as current term
                </label>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  Public Holidays
                </h3>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Holiday name"
                    value={holidayForm.name}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, name: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <input
                    type="date"
                    value={holidayForm.date}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, date: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex gap-3 mb-3">
                  <select
                    value={holidayForm.type}
                    onChange={(e) =>
                      setHolidayForm({ ...holidayForm, type: e.target.value })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    <option value="public">Public</option>
                    <option value="school">School</option>
                    <option value="religious">Religious</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={holidayForm.description}
                    onChange={(e) =>
                      setHolidayForm({
                        ...holidayForm,
                        description: e.target.value,
                      })
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddHoliday}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>

                {formData.holidays.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.holidays.map((h, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-700">
                            {h.name}
                          </span>
                          <span className="text-gray-500">
                            {new Date(h.date).toLocaleDateString()}
                          </span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                            {h.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHoliday(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  {editingTerm ? "Update Term" : "Create Term"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this term? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

