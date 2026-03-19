import React from 'react';

const FEATURES = [
  {
    title: 'Dynamic Academic Monitoring',
    description: 'Live learning analytics and assessment graphs help teachers and parents track progress at a glance.',
    icon: '📊',
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'AI-Powered Support',
    description: 'In-app AI coach delivers personalized tips, learning recommendations, and intervention prompts.',
    icon: '🤖',
    accent: 'from-fuchsia-500 to-purple-500',
  },
  {
    title: 'Unified Management',
    description: 'Central dashboard for budgets, staff, and student operations, designed for school leaders.',
    icon: '📋',
    accent: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Two-Way Communication',
    description: 'Timestamped remarks make interactions between parents and teachers clear and trackable.',
    icon: '💬',
    accent: 'from-orange-500 to-amber-500',
  },
];

export default function CoreFeatures() {
  return (
    <section className="w-full bg-gradient-to-b from-white via-slate-50 to-white py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-widest uppercase">
            Solution Overview
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Core Features that Power KiddiesCheck
          </h2>
          <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
            A comprehensive platform built for trust and transparency, from classroom metrics to administrative operations.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl bg-white p-6 sm:p-7 shadow-md border border-slate-200 hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 group"
            >
              <div className={`w-14 h-14 rounded-2xl inline-flex items-center justify-center text-white text-2xl bg-gradient-to-r ${feature.accent} group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="inline-flex items-center text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Learn more →
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-start">
          <article className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 p-7 sm:p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Real-time Assessment Insights</h3>
                <p className="text-slate-600 mt-2 text-sm">Track class scores and flag students needing intervention with interactive graphs.</p>
              </div>
              <span className="text-3xl">📊</span>
            </div>
            <div className="h-[240px] rounded-2xl bg-white border border-slate-300 p-4 flex items-center justify-center text-slate-400 shadow-inner">
              <div className="text-center">
                <p className="font-semibold mb-1">Graph mockup</p>
                <p className="text-xs">(score trends, mastery lines)</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-gradient-to-br from-fuchsia-50 via-purple-50 to-indigo-50 p-7 sm:p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">AI Assistive Chat</h3>
                <p className="text-slate-600 mt-2 text-sm">Conversational AI suggestions for next steps in instruction and parent engagement.</p>
              </div>
              <span className="text-3xl">🤖</span>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-slate-500 h-[240px] flex items-center justify-center bg-white/40">
              <div className="text-center">
                <p className="font-semibold mb-1">AI chat interface</p>
                <p className="text-xs">Smart suggestions & insights</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-white p-7 sm:p-8 shadow-md border border-slate-200 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Communication & Remarks</h3>
                <p className="text-slate-600 mt-2 text-sm">Preserve meaningful feedback with timestamps and read status for each conversation.</p>
              </div>
              <span className="text-3xl">💬</span>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 h-[240px] overflow-y-auto bg-slate-50/50 space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                <p className="text-xs font-semibold text-blue-600">10:08 AM — Teacher</p>
                <p className="text-sm text-slate-700 mt-1">Student progress is excellent in literacy.</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-xs font-semibold text-slate-600">10:14 AM — Parent</p>
                <p className="text-sm text-slate-700 mt-1">Thanks for the update! Can we schedule a discussion?</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
