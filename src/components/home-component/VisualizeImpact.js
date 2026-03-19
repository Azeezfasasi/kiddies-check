import React from 'react';

const IMPACT_CARDS = [
  {
    title: 'Parent Engagement',
    value: '85%+ active usage',
    description: 'Real-time analytics help parents stay informed and get involved without delays.',
    icon: '👨‍👩‍👧',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Teacher Efficiency',
    value: '40% less time spent',
    description: 'One workflow for class assessments, feedback, and progress records.',
    icon: '👩‍🏫',
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Accountability',
    value: 'Automated alerts + finance insights',
    description: 'Auto notices and budget dashboards keep administrators in control.',
    icon: '📊',
    color: 'from-purple-500 to-indigo-500',
  },
];

export default function VisualizeImpact() {
  return (
    <section className="w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold tracking-widest uppercase">
            Expected Impact
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Visualized Impact for Your School Community
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
            Data-backed outcomes that foster trust across parents, teachers, and administrators in a single unified platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {IMPACT_CARDS.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-3xl bg-gradient-to-r ${item.color}`}>
                <span className="text-2xl" role="img" aria-label={item.title}>
                  {item.icon}
                </span>
              </div>

              <h3 className="mt-5 text-xl sm:text-2xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-indigo-600 font-semibold text-lg">{item.value}</p>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">{item.description}</p>

              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs uppercase tracking-wider text-slate-400">Key performance area</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-gradient-to-r from-blue-50 to-cyan-50 p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Parent engagement uplift</h3>
            <p className="mt-2 text-slate-700 text-sm">Parents receive immediate insights into student performance, enabling timely support actions.</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-r from-emerald-50 to-green-50 p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Workflow simplification</h3>
            <p className="mt-2 text-slate-700 text-sm">Teachers handle multiple tasks in one place — assessments, remarks, and progress reviews, all synced.</p>
          </div>
          <div className="rounded-3xl bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Admin accountability</h3>
            <p className="mt-2 text-slate-700 text-sm">Automated notifications and budgeting metrics make compliance and resource planning effortless.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
