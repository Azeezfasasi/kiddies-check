"use client";
import React from "react";
import DashboardStats from "@/components/dashboard-component/DashboardStats";
import DashboardWelcome from "@/components/dashboard-component/DashboardWelcome";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";
import QuoteChart from "@/components/dashboard-component/QuoteChart";
import UserChart from "@/components/dashboard-component/UserChart";

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
        <div className="flex flex-col lg:flex-row gap-6 justify-center mt-6">
          <QuoteChart />
          <UserChart />
        </div>
        </>
      ) : null}
    </>
  );
}
