"use client"
import React, { useEffect, useState } from 'react'
import { useAuth } from "@/context/AuthContext";
import { Briefcase, NotepadText } from 'lucide-react';
import Link from 'next/link';
import { can, isPlatformRole, roleLabel } from '@/utils/roles';

// Roles that work within a school and see its name in the welcome card
const SCHOOL_NAME_ROLES = ['teacher', 'school-leader', 'learning-specialist', 'parent'];

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
  const [schoolName, setSchoolName] = useState("");


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

  // School-based roles see the name of the school they're working in
  useEffect(() => {
    if (!SCHOOL_NAME_ROLES.includes(user?.role)) return;

    const cachedName = localStorage.getItem("schoolName");
    if (cachedName) setSchoolName(cachedName);

    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    const token = localStorage.getItem("token");
    if (!schoolId || !token) return;

    const loadSchoolName = async () => {
      try {
        const res = await fetch(`/api/schools/${schoolId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.school?.name) {
          setSchoolName(data.school.name);
          localStorage.setItem("schoolName", data.school.name);
        }
      } catch (error) {
        console.error("Failed to load school name", error);
      }
    };

    loadSchoolName();
  }, [user?.role]);

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
  const atSchool = schoolName ? <> at <span className="not-italic font-bold">{schoolName}</span></> : null;

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
            {/* add role-specific content here */}
            {user?.role === 'admin' && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You have administrative privileges.
              </p>
            )}
            {user?.role === 'learning-specialist' && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You are a learning specialist{atSchool}.
              </p>
            )}

            {user?.role === 'school-leader' && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You are a school leader{atSchool}.
              </p>
            )}
            {user?.role === 'student' && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You are a student.
              </p>
            )}
            {user?.role === 'teacher' && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You are a teacher{atSchool}.
              </p>
            )}
            {isPlatformRole(user?.role) && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You are signed in as {roleLabel(user.role)}.
              </p>
            )}
            {user?.role === 'parent' && (
              <p className="text-xs text-blue-800 font-semibold italic">
                You are a parent{atSchool}.
              </p>
            )}
          </div>
        </div>

        {user?.role === 'admin' || (can(user?.role, 'registrations') && can(user?.role, 'blog')) ? (
        <div className="flex flex-col lg:flex-row md:items-center gap-3">
          <Link href="/dashboard/manage-registration" className="inline-flex justify-center items-center gap-2 px-3 py-1 md:py-2 bg-blue-900 text-white rounded-md text-sm hover:bg-blue-800 cursor-pointer">
            <Briefcase />
            Manage Registrations
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
