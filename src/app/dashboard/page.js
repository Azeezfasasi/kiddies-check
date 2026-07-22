"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";
import SchoolBaseAttendanceChat from "@/components/dashboard-component/SchoolBaseAttendanceChat";

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

export default function Dashboard() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { user } = useAuth();

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
        <DashboardStats />
        <div className="flex flex-col lg:flex-col gap-6 justify-center mt-6">
          <PerformanceChart />
          <AttendanceChart />
          <UserChart /> 
        </div>
        </>
      ) : user?.role === 'school-leader' ? (
        <>
          <SchoolLeaderStats />
          <SchoolBaseAttendanceChat />
        </>
      ) : user?.role === 'teacher' ? (
        <>
          <TeacherStats />
          <SchoolBaseAttendanceChat />
        </>
      ) : user?.role === 'learning-specialist' ? (
        <>
          <SchoolLeaderStats />
          <SchoolBaseAttendanceChat />
        </>
      ) : null}
    </>
  );
}
