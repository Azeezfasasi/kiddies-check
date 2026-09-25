"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";
import SchoolBaseAttendanceChat from "@/components/dashboard-component/SchoolBaseAttendanceChat";
import Link from "next/link";
import { can, hasAllSchoolAccess, isPlatformRole, type Feature } from "@/utils/roles";

// Home-page shortcuts for roles without a school dashboard (media/content managers).
const CONTENT_LINKS = [
  { feature: "blog", href: "/dashboard/manage-blog", label: "Manage Blogs", description: "Write, edit and publish blog posts" },
  { feature: "gallery", href: "/dashboard/all-gallery", label: "Gallery", description: "Upload and organise gallery albums" },
  { feature: "site-content", href: "/dashboard/hero-slider", label: "Homepage Contents", description: "Hero slider, services, testimonials and more" },
  { feature: "site-content", href: "/dashboard/company-overview", label: "About Page Contents", description: "Company overview, milestones and team" },
  { feature: "newsletter", href: "/dashboard/all-newsletters", label: "Newsletters", description: "Compose newsletters and manage subscribers" },
  { feature: "contact-responses", href: "/dashboard/contact-form-responses", label: "Contact Form Responses", description: "Messages sent through the contact form" },
];

const DashboardWelcome = dynamic(() => import("@/components/dashboard-component/DashboardWelcome"), {
  ssr: false,
  loading: () => <div className="h-24 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const DashboardStats = dynamic(() => import("@/components/dashboard-component/DashboardStats"), {
  ssr: false,
  loading: () => <div className="mt-6 h-24 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const SchoolLeaderStats = dynamic(() => import("@/components/dashboard-component/SchoolLeaderStats"), {
  ssr: false,
  loading: () => <div className="mt-6 h-24 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const TeacherStats = dynamic(() => import("@/components/dashboard-component/TeacherStats"), {
  ssr: false,
  loading: () => <div className="mt-6 h-24 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const PerformanceChart = dynamic(() => import("@/components/dashboard-component/PerformaceChart"), {
  ssr: false,
  loading: () => <div className="h-80 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const AttendanceChart = dynamic(() => import("@/components/dashboard-component/AttendanceChart"), {
  ssr: false,
  loading: () => <div className="h-80 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const UserChart = dynamic(() => import("@/components/dashboard-component/UserChart"), {
  ssr: false,
  loading: () => <div className="h-80 rounded-xl bg-white shadow-sm animate-pulse" />,
});

const TeacherAttendanceActivityChart = dynamic(() => import("@/components/dashboard-component/TeacherAttendanceActivityChart"), {
  ssr: false,
  loading: () => <div className="h-80 rounded-xl bg-white shadow-sm animate-pulse" />,
});

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSchoolId, setSelectedSchoolId] = React.useState(null);

  React.useEffect(() => {
    const schoolId = localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId");
    setSelectedSchoolId(schoolId);
  }, []);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" /></div>;
  }
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <DashboardWelcome />

      {user?.role === 'admin' ? (
        <>
        <DashboardStats schoolId={selectedSchoolId} />
        <div className="flex flex-col lg:flex-col gap-6 justify-center mt-6">
          <PerformanceChart schoolId={selectedSchoolId} />
          <AttendanceChart schoolId={selectedSchoolId} />
          <TeacherAttendanceActivityChart schoolId={selectedSchoolId} />
          <UserChart schoolId={selectedSchoolId} />
        </div>
        </>
      ) : user?.role === 'school-leader' ? (
        <>
          <SchoolLeaderStats />
          <TeacherAttendanceActivityChart />
          <SchoolBaseAttendanceChat />
          <div className="mt-6">
            <PerformanceChart />
          </div>
        </>
      ) : user?.role === 'teacher' ? (
        <>
          <TeacherStats />
          <TeacherAttendanceActivityChart />
          <SchoolBaseAttendanceChat />
          <div className="mt-6">
            <PerformanceChart />
          </div>
        </>
      ) : user?.role === 'learning-specialist' || (isPlatformRole(user?.role) && hasAllSchoolAccess(user?.role)) ? (
        <>
          <SchoolLeaderStats />
          <TeacherAttendanceActivityChart />
          <SchoolBaseAttendanceChat />
          <PerformanceChart />
        </>
      ) : isPlatformRole(user?.role) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {CONTENT_LINKS.filter((l) => can(user.role, l.feature as Feature)).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-300 hover:shadow-md transition"
            >
              <p className="font-semibold text-gray-800">{l.label}</p>
              <p className="text-sm text-gray-500 mt-1">{l.description}</p>
            </Link>
          ))}
        </div>
      ) : null}
    </>
  );
}
