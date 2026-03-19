"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from "@/context/AuthContext";
import { Briefcase, NotepadText } from 'lucide-react';
import Link from 'next/link';

function getGreeting(date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardWelcome() {
  const { user, loading } = useAuth();
  const [now, setNow] = useState(null);
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [greeting, setGreeting] = useState("");


  useEffect(() => {
    function updateTime() {
      const current = new Date();
      setNow(current);
      setGreeting(getGreeting(current));
      setDateStr(new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(current));
      setTimeStr(new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(current));
    }
    updateTime();
    const t = setInterval(updateTime, 60_000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 lg:p-8 text-center">
        <div className="text-gray-500 font-semibold">Loading...</div>
      </section>
    );
  }
  if (!user) {
    return (
      <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 lg:p-8 text-center">
        <div className="text-red-600 font-semibold">You are not authorized. Please log in.</div>
      </section>
    );
  }

  // Get first name and role from user object
  const firstName = user?.firstName || (user?.name ? user.name.split(" ")[0] : "Admin");
  const role = user?.role || "";

  return (
    <section className="bg-white rounded-lg shadow-sm p-5 md:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xl font-bold">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h1 className="text-lg md:text-2xl font-semibold text-gray-900">
              {greeting}, <span className="text-blue-900">{firstName}</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">{dateStr} • {timeStr}</p>
          </div>
        </div>

        {user?.role === 'admin' || user?.role === 'learning-specialist' ? (
        <div className="flex flex-col lg:flex-row md:items-center gap-3">
          <Link href="/dashboard/add-projects" className="inline-flex justify-center items-center gap-2 px-3 py-1 md:py-2 bg-blue-900 text-white rounded-md text-sm hover:bg-blue-800 cursor-pointer">
            <Briefcase />
            Add Projects
          </Link>

          <Link href="/dashboard/add-blog" className="inline-flex justify-center items-center gap-2 px-3 py-1 md:py-2 border bg-gray-100 border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
            <NotepadText />
            Publish Blog Posts
          </Link>
        </div>
        ) : null}
      </div>
    </section>
  );
}
