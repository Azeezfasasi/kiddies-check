"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "billingScope";

const readStoredScope = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

/**
 * Shared school / session / term selection for the billing pages. The
 * choice is remembered so moving between Student Bills, Fee Setup and
 * Payment History keeps the same context.
 */
export default function useBillingScope() {
  const router = useRouter();
  // Role comes from the auth profile, not localStorage.userRole, which
  // isn't cleared on logout and can belong to a previous user.
  const { user, loading: authLoading } = useAuth();
  const role = user?.role || "";
  const [token, setToken] = useState("");
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [calendarTerms, setCalendarTerms] = useState([]);
  const [academicSession, setAcademicSession] = useState("");
  const [term, setTerm] = useState("");
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const t = localStorage.getItem("token");
    if (!t) {
      router.push("/login");
      return;
    }
    if (!role) {
      setInitialised(true);
      return;
    }
    setToken(t);

    const stored = readStoredScope();
    const headers = { Authorization: `Bearer ${t}` };

    const loadSchools = async () => {
      if (role === "admin") {
        const res = await fetch("/api/schools?pageSize=500", { headers });
        const data = await res.json().catch(() => ({}));
        const list = data.schools || [];
        setSchools(list);
        const initial = list.find((s) => s._id === stored.schoolId) || list[0];
        if (initial) {
          setSchoolId(initial._id);
          setSchoolName(initial.name);
        }
      } else {
        // School leaders and learning specialists are locked to their
        // active school, matching grade promotion.
        const ownId =
          localStorage.getItem("activeSchoolId") ||
          localStorage.getItem("schoolId") ||
          (user?.schoolId?._id || user?.schoolId || "").toString();
        if (!ownId) return;
        setSchoolId(ownId);
        setSchoolName(localStorage.getItem("schoolName") || "");
        const res = await fetch(`/api/schools/${ownId}`, { headers });
        const data = await res.json().catch(() => ({}));
        if (data.success && data.school?.name) setSchoolName(data.school.name);
      }
    };

    const loadCalendar = async () => {
      const res = await fetch("/api/admin/academic-calendar", { headers });
      const data = await res.json().catch(() => ({}));
      const terms = data.terms || [];
      setCalendarTerms(terms);

      const current = terms.find((x) => x.isCurrent);
      const storedValid = terms.some((x) => x.session === stored.academicSession && x.term === stored.term);
      if (storedValid) {
        setAcademicSession(stored.academicSession);
        setTerm(stored.term);
      } else if (current) {
        setAcademicSession(current.session);
        setTerm(current.term);
      } else if (terms.length > 0) {
        const latest = [...terms].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
        setAcademicSession(latest.session);
        setTerm(latest.term);
      }
    };

    Promise.allSettled([loadSchools(), loadCalendar()]).finally(() => setInitialised(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the signed-in role changes
  }, [router, authLoading, role]);

  useEffect(() => {
    if (!initialised) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schoolId, academicSession, term }));
    } catch {
      // Storage unavailable — the selection just won't be remembered.
    }
  }, [initialised, schoolId, academicSession, term]);

  const sessions = [...new Set(calendarTerms.map((t) => t.session))].sort((a, b) => b.localeCompare(a));
  const termsForSession = calendarTerms
    .filter((t) => t.session === academicSession)
    .map((t) => t.term)
    .sort((a, b) => ["first", "second", "third"].indexOf(a) - ["first", "second", "third"].indexOf(b));

  const selectSchool = (id) => {
    setSchoolId(id);
    setSchoolName(schools.find((s) => s._id === id)?.name || "");
  };

  const selectSession = (session) => {
    setAcademicSession(session);
    const available = calendarTerms.filter((t) => t.session === session).map((t) => t.term);
    if (!available.includes(term)) setTerm(available[0] || "");
  };

  return {
    token,
    role,
    schools,
    schoolId,
    schoolName,
    sessions,
    termsForSession,
    calendarTerms,
    academicSession,
    term,
    initialised,
    ready: initialised && !!token && !!schoolId && !!academicSession && !!term,
    selectSchool,
    selectSession,
    setTerm,
  };
}
