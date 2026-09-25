"use client";

import { useState, useEffect } from "react";

export default function HeroAdminForm() {
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    cta: "",
    image: "",
  });

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/hero");
      const data = await res.json();
      if (data) setForm(data);
    }
    loadData();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await fetch("/api/hero", {
      method: "PUT",
      body: JSON.stringify(form),
    });
    alert("Hero content updated!");
  }

  return (
    <form className="space-y-4 max-w-xl" onSubmit={handleSubmit}>
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Hero title"
        className="w-full border p-2"
      />

      <input
        name="subtitle"
        value={form.subtitle}
        onChange={handleChange}
        placeholder="Subtitle"
        className="w-full border p-2"
      />

      <input
        name="cta"
        value={form.cta}
        onChange={handleChange}
        placeholder="Button Text"
        className="w-full border p-2"
      />

      <input
        name="image"
        value={form.image}
        onChange={handleChange}
        placeholder="Image URL"
        className="w-full border p-2"
      />

      <button className="bg-green-600 text-white px-6 py-2 rounded">
        Save
      </button>
    </form>
  );
}
