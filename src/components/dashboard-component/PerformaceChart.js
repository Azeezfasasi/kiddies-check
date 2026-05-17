

"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function PerformanceChart({ 
  currentPerformance = [],
  previousPerformanceData = [],
  title = "Student Performance Overview" 
}) {
  // Default sample data if none provided
  const defaultCurrentData = [
    { name: "Excellent (75-100)", value: 35, fill: "#10b981" },
    { name: "Good (65-74)", value: 28, fill: "#3b82f6" },
    { name: "Average (50-64)", value: 22, fill: "#f59e0b" },
    { name: "Below Average (40-49)", value: 12, fill: "#ef5350" },
    { name: "Poor (<40)", value: 3, fill: "#d32f2f" },
  ];

  const defaultPreviousData = [
    { name: "Excellent (75-100)", value: 35, fill: "#10b981" },
    { name: "Good (65-74)", value: 28, fill: "#3b82f6" },
    { name: "Average (50-64)", value: 22, fill: "#f59e0b" },
    { name: "Below Average (40-49)", value: 12, fill: "#ef5350" },
    { name: "Poor (<40)", value: 3, fill: "#d32f2f" },
  ];

  const chartData = currentPerformance.length > 0 ? currentPerformance : defaultCurrentData;
  const previousData = previousPerformanceData.length > 0 ? previousPerformanceData : defaultPreviousData;

  // Calculate metrics
  const calculateWeightedAverage = (data) => {
    const scoreMap = {
      "Excellent (75-100)": 95,
      "Good (65-74)": 85,
      "Average (50-64)": 75,
      "Below Average (40-49)": 65,
      "Poor (<40)": 50,
    };

    const totalStudents = data.reduce((sum, item) => sum + item.value, 0);
    if (totalStudents === 0) return 0;

    const weightedSum = data.reduce((sum, item) => {
      const score = scoreMap[item.name] || 0;
      return sum + score * item.value;
    }, 0);

    return Math.round(weightedSum / totalStudents);
  };

  const currentAverage = calculateWeightedAverage(chartData);
  const previousAverage = calculateWeightedAverage(previousData);
  const trend = currentAverage - previousAverage;
  const trendPercentage = previousAverage > 0 
    ? Math.round((trend / previousAverage) * 100) 
    : 0;

  const excellentCount = chartData.find(item => item.name.includes("Excellent"))?.value || 0;
  const totalStudents = chartData.reduce((sum, item) => sum + item.value, 0);
  const excellenceRate = totalStudents > 0 ? Math.round((excellentCount / totalStudents) * 100) : 0;

  const previousExcellentCount = previousData.find(item => item.name.includes("Excellent"))?.value || 0;
  const previousTotalStudents = previousData.reduce((sum, item) => sum + item.value, 0);
  const previousExcellenceRate = previousTotalStudents > 0 ? Math.round((previousExcellentCount / previousTotalStudents) * 100) : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{data.name}</p>
          <p className="text-sm text-gray-600">Students: {data.value}</p>
          <p className="text-sm text-gray-600">
            {totalStudents > 0 ? `${Math.round((data.value / totalStudents) * 100)}%` : "0%"}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderTrendIcon = (value) => {
    if (value > 0) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else if (value < 0) {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    } else {
      return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (value) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getTrendBgColor = (value) => {
    if (value > 0) return "bg-green-50 border-green-200";
    if (value < 0) return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">Performance analysis and trend comparison</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Average Score */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-blue-700">Overall Performance</p>
            {trend !== 0 && renderTrendIcon(trend)}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-blue-600">{currentAverage}%</p>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-semibold ${getTrendColor(trend)}`}>
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">vs. Previous: {previousAverage}%</p>
        </div>

        {/* Excellence Rate */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-700">Excellence Rate</p>
            {excellenceRate > previousExcellenceRate && <TrendingUp className="w-5 h-5 text-green-600" />}
            {excellenceRate < previousExcellenceRate && <TrendingDown className="w-5 h-5 text-red-600" />}
            {excellenceRate === previousExcellenceRate && <Minus className="w-5 h-5 text-gray-600" />}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-green-600">{excellenceRate}%</p>
            <span className={`text-sm font-semibold ${excellenceRate > previousExcellenceRate ? "text-green-600" : excellenceRate < previousExcellenceRate ? "text-red-600" : "text-gray-600"}`}>
              {excellenceRate > previousExcellenceRate ? "+" : ""}{excellenceRate - previousExcellenceRate}%
            </span>
          </div>
          <p className="text-xs text-green-600 mt-2">Students scoring 75-100</p>
        </div>

        {/* Total Students */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-700 mb-3">Total Students Assessed</p>
          <p className="text-3xl font-bold text-purple-600">{totalStudents}</p>
          <p className="text-xs text-purple-600 mt-2">
            {previousTotalStudents > 0 
              ? `${totalStudents - previousTotalStudents > 0 ? "+" : ""}${totalStudents - previousTotalStudents} more than previous`
              : "Initial assessment"
            }
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Performance Pie Chart */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${value}`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => `${value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Summary */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
            <div className="space-y-3">
              {chartData.map((item, index) => {
                const percentage = totalStudents > 0 ? Math.round((item.value / totalStudents) * 100) : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      ></div>
                      <span className="text-sm text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.fill,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 min-w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Card */}
          <div className={`rounded-lg p-4 border ${getTrendBgColor(trend)}`}>
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {renderTrendIcon(trend)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {trend > 0 
                    ? "Performance Improved" 
                    : trend < 0 
                    ? "Performance Declined" 
                    : "Performance Stable"}
                </p>
                <p className={`text-xs mt-1 ${getTrendColor(trend)}`}>
                  {trend > 0 
                    ? `Overall performance increased by ${Math.abs(trend)}% compared to the previous assessment.` 
                    : trend < 0 
                    ? `Overall performance decreased by ${Math.abs(trend)}% compared to the previous assessment.` 
                    : "No significant change from the previous assessment."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm font-semibold text-gray-800 mb-3">Grade Scale Reference</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Excellent", range: "75-100", color: "#10b981" },
            { label: "Good", range: "65-74", color: "#3b82f6" },
            { label: "Average", range: "50-64", color: "#f59e0b" },
            { label: "Below Avg", range: "40-49", color: "#ef5350" },
            { label: "Poor", range: "<40", color: "#d32f2f" },
          ].map((grade, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: grade.color }}
              ></div>
              <div>
                <p className="text-xs font-medium text-gray-800">{grade.label}</p>
                <p className="text-xs text-gray-600">{grade.range}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
