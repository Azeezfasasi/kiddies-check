"use client";

import { useEffect, useState } from "react";
import { Loader, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function TrendChart({ studentId, subjectId, schoolId, userId }) {
  const [trendData, setTrendData] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId && subjectId) {
      fetchTrendData();
    }
  }, [studentId, subjectId]);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/teacher/assessments?schoolId=${schoolId}&studentId=${studentId}&subjectId=${subjectId}`,
        {
          headers: { "x-user-id": userId },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAssessmentHistory(data.assessments || []);

        // Calculate trend from assessments
        if (data.assessments && data.assessments.length > 0) {
          const scores = data.assessments.map((a) => a.score);
          const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const highestScore = Math.max(...scores);
          const lowestScore = Math.min(...scores);

          let trend = "stable";
          let trendPercentage = 0;

          if (scores.length >= 3) {
            const firstThreeAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
            const lastThreeAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3;
            const change = lastThreeAvg - firstThreeAvg;
            trendPercentage = ((change / firstThreeAvg) * 100).toFixed(2);

            if (change > 5) trend = "improving";
            else if (change < -5) trend = "declining";
          }

          setTrendData({
            averageScore: parseFloat(averageScore.toFixed(2)),
            highestScore,
            lowestScore,
            totalAssessments: scores.length,
            trend,
            trendPercentage,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader className="w-5 h-5 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!trendData || assessmentHistory.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        Only one assessment recorded - need more data for trend analysis
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "declining":
        return <TrendingDown className="w-5 h-5 text-red-600" />;
      default:
        return <Minus className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case "improving":
        return "from-green-50 to-green-100";
      case "declining":
        return "from-red-50 to-red-100";
      default:
        return "from-gray-50 to-gray-100";
    }
  };

  const getTrendTextColor = (trend) => {
    switch (trend) {
      case "improving":
        return "text-green-700";
      case "declining":
        return "text-red-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className="mt-4 space-y-4">
      {/* Trend Summary */}
      <div
        className={`bg-gradient-to-br ${getTrendColor(
          trendData.trend
        )} p-4 rounded-lg border border-opacity-30`}
      >
        <div className="flex items-center gap-3 mb-3">
          {getTrendIcon(trendData.trend)}
          <span className={`font-semibold capitalize ${getTrendTextColor(trendData.trend)}`}>
            Trend: {trendData.trend}
          </span>
          {trendData.trendPercentage !== 0 && (
            <span className={`text-sm font-semibold ${getTrendTextColor(trendData.trend)}`}>
              ({trendData.trendPercentage}%)
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <p className="text-xs text-gray-600">Average Score</p>
            <p className="text-lg font-bold text-purple-600">{trendData.averageScore}%</p>
          </div>
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <p className="text-xs text-gray-600">Highest Score</p>
            <p className="text-lg font-bold text-green-600">{trendData.highestScore}%</p>
          </div>
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <p className="text-xs text-gray-600">Lowest Score</p>
            <p className="text-lg font-bold text-red-600">{trendData.lowestScore}%</p>
          </div>
          <div className="bg-white bg-opacity-50 p-2 rounded">
            <p className="text-xs text-gray-600">Assessments</p>
            <p className="text-lg font-bold text-blue-600">{trendData.totalAssessments}</p>
          </div>
        </div>
      </div>

      {/* Score Timeline - Text-based progression */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Assessment Timeline</p>
        <div className="space-y-1">
          {assessmentHistory.map((assessment, index) => (
            <div key={assessment._id} className="flex items-center gap-3 text-sm">
              <span className="text-xs font-semibold text-gray-500 w-8">W{assessment.week}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-6 bg-gray-200 rounded flex items-center relative">
                  <div
                    className="h-full bg-purple-600 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ width: `${assessment.score}%` }}
                  >
                    {assessment.score >= 25 && `${assessment.score}%`}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-600 w-12 text-right">{assessment.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
