/**
 * Example Integration: Parent Dashboard with AI Chat
 * This file shows how to integrate the AIChat component into the parent dashboard
 * 
 * Copy this pattern to integrate AI into:
 * - Parent student view
 * - Teacher class pages
 * - Admin dashboard
 * - Learning specialist pages
 */

'use client';

import { useState, useEffect } from 'react';
import AIChat from '@/components/AIChat';
import { AlertCircle, Info } from 'lucide-react';

export default function ParentStudentView() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real implementation, fetch actual student data
    // Example data structure
    setStudentData({
      name: "Emma Johnson",
      gradeLevel: "Grade 4",
      subjects: ["Mathematics", "English Language Arts", "Science", "Social Studies"],
      recentPerformance: "Emma shows excellent progress in reading comprehension and science. She is developing her skills in fraction concepts and could benefit from additional practice with word problems in mathematics.",
      recentAssessments: [
        { subject: "Mathematics", score: 78, date: "2024-03-15" },
        { subject: "Reading", score: 92, date: "2024-03-10" },
        { subject: "Science", score: 88, date: "2024-03-08" }
      ],
      strengths: [
        "Strong oral communication",
        "Collaborative problem-solving",
        "Creative thinking",
        "Reading fluency"
      ],
      areasForGrowth: [
        "Written expression",
        "Mathematical reasoning with word problems",
        "Completing independent assignments"
      ]
    });
    
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading student data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {studentData?.name}'s Learning Progress
          </h1>
          <p className="text-gray-600 mt-2">{studentData?.gradeLevel}</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Info & Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Performance
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {studentData?.recentPerformance}
              </p>

              {/* Strengths */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3 text-green-700">
                  ✓ Strengths
                </h3>
                <ul className="space-y-2">
                  {studentData?.strengths.map((strength, idx) => (
                    <li key={idx} className="text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Areas for Growth */}
              <div className="mt-6">
                <h3 className="font-semibold mb-3 text-blue-700">
                  → Areas for Growth
                </h3>
                <ul className="space-y-2">
                  {studentData?.areasForGrowth.map((area, idx) => (
                    <li key={idx} className="text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent Assessments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Assessments
              </h2>
              <div className="space-y-3">
                {studentData?.recentAssessments.map((assessment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {assessment.subject}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(assessment.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {assessment.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Chat */}
          <div className="lg:col-span-1 h-fit sticky top-4">
            {/* Info Banner */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  AI Learning Assistant
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Ask questions about Emma's performance and get personalized
                  learning strategies.
                </p>
              </div>
            </div>

            {/* AI Chat Component */}
            <AIChat
              userRole="parent"
              studentData={{
                name: studentData?.name,
                gradeLevel: studentData?.gradeLevel,
                subjects: studentData?.subjects,
                recentPerformance: studentData?.recentPerformance
              }}
              title="Ask About Learning"
              placeholder="E.g., 'How can I help with math?' 'What are Emma's strengths?'"
              maxHeight="h-[500px]"
            />

            {/* Safety Note */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> If you have concerns about your
                child's development, wellbeing, or learning, please speak with
                the teacher or school counselor.
              </p>
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Example Questions to Ask the AI Assistant
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "How can I support Emma's reading at home?",
              "What strategies help with word problem solving?",
              "How is Emma doing compared to her own progress?",
              "What types of activities would help Emma develop writing skills?",
              "How can I encourage more independent work?",
              "What should we focus on during study time at home?"
            ].map((question, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 rounded border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-colors"
              >
                <p className="text-sm text-gray-700">{question}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
