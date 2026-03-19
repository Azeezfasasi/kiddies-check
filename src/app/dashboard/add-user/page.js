"use client";
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const roles = [
  { value: "parent", label: "Parent" },
  { value: "admin", label: "Admin" },
  { value: "learning-specialist", label: "Learning Specialist" },
  { value: "school-leader", label: "School Leader" },
  { value: "teacher", label: "Teacher" },
];

export default function AddUserPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "client",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("User created successfully.");
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "client",
        });
      } else {
        setError(data.message || "Failed to create user.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
    <div className="max-w-xl mx-auto p-4 md:p-8 bg-white rounded-xl shadow-lg mt-3 md:mt-8">
      <h1 className="text-[20px] md:text-2xl font-bold mb-6">Add New User</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block mb-1 font-medium">First Name</label>
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="w-full border border-gray-50 px-3 py-2 rounded-lg ring-1 focus:ring-blue-300 outline-none"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="w-full border border-gray-50 px-3 py-2 rounded-lg ring-1 focus:ring-blue-300 outline-none"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-50 px-3 py-2 rounded-lg ring-1 focus:ring-blue-300 outline-none"
            required
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-50 px-3 py-2 rounded-lg ring-1 focus:ring-blue-300 outline-none"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-50 px-3 py-2 rounded-lg ring-1 focus:ring-blue-300 outline-none"
              required
            />
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-gray-50 px-3 py-2 rounded-lg ring-1 focus:ring-blue-300 outline-none"
            required
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {error && <div className="text-red-600 font-medium">{error}</div>}
        {success && <div className="text-green-600 font-medium">{success}</div>}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating..." : "Add User"}
        </button>
      </form>
    </div>
    </ProtectedRoute>
  );
}
