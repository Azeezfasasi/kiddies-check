"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  BookOpen,
  BarChart3,
  Clock,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";

function AnimatedCount({ value = 0, duration = 800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = display;
    const to = Number(value) || 0;

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (t < 1) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="text-3xl md:text-4xl font-bold text-white">{display.toLocaleString()}</span>;
}

function StatCard({ icon: Icon, label, value, color, loading, subtext }) {
  return (
    <div
      className={`rounded-lg p-6 text-white shadow-lg transform transition-all duration-200 hover:scale-105 ${
        color === "blue"
          ? "bg-gradient-to-br from-blue-500 to-blue-600"
          : color === "purple"
          ? "bg-gradient-to-br from-purple-500 to-purple-600"
          : color === "green"
          ? "bg-gradient-to-br from-green-500 to-green-600"
          : color === "red"
          ? "bg-gradient-to-br from-red-500 to-red-600"
          : color === "amber"
          ? "bg-gradient-to-br from-amber-500 to-amber-600"
          : "bg-gradient-to-br from-cyan-500 to-cyan-600"
      } ${loading ? "opacity-70" : ""}`}
    >
      <div className="flex items-end justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium opacity-90 mb-2">{label}</div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <AnimatedCount value={value} />
                {typeof subtext === "string" && (
                  <span className="text-xs opacity-75 ml-2">{subtext}</span>
                )}
              </>
            )}
          </div>
        </div>
        <Icon className="w-10 h-10 opacity-80 shrink-0" />
      </div>
    </div>
  );
}

export default function TeacherStats() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const schoolId = typeof window !== "undefined" ? localStorage.getItem("activeSchoolId") || localStorage.getItem("schoolId") : null;

  useEffect(() => {
    if (!schoolId || !token || user?.role !== "teacher") return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `/api/teacher/stats?schoolId=${schoolId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch teacher stats:", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [schoolId, token, user?.role]);

  if (error && !stats) {
    return (
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  const cardData = [
    {
      icon: Users,
      label: "My Students",
      value: stats?.totalStudents || 0,
      color: "blue",
      subtext: "across all classes",
    },
    {
      icon: BookOpen,
      label: "Classes Teaching",
      value: stats?.classesTeaching || 0,
      color: "purple",
      subtext: "active classes",
    },
    {
      icon: BarChart3,
      label: "Subjects",
      value: stats?.subjectsTeaching || 0,
      color: "green",
      subtext: "handled subjects",
    },
    {
      icon: Zap,
      label: "Assessments Created",
      value: stats?.assessmentsCreated || 0,
      color: "red",
      subtext: "total assessments",
    },
    {
      icon: Clock,
      label: "Avg Assessment Rate",
      value: stats?.assessmentRate ? parseFloat(stats.assessmentRate).toFixed(1) : 0,
      color: "amber",
      subtext: "%",
    },
  ];

  return (
    <section className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          My Teaching Summary
        </h2>
        <p className="text-gray-600">
          Overview of your teaching activities and student data
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {cardData.map((card, index) => (
          <StatCard
            key={index}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
            loading={loading}
            subtext={card.subtext}
          />
        ))}
      </div>
    </section>
  );
}
