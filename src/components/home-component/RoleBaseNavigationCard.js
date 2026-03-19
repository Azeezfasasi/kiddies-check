import Link from 'next/link';

const ROLE_CARDS = [
  {
    role: 'Parent',
    description: 'View child performance and engage with AI coaching',
    href: '/register?role=parent',
    icon: '👨‍👩‍👧',
    color: 'from-pink-500 to-fuchsia-500',
  },
  {
    role: 'Teacher',
    description: 'Streamline weekly data entry and student assessments',
    href: '/register?role=teacher',
    icon: '👩‍🏫',
    color: 'from-emerald-500 to-lime-500',
  },
  {
    role: 'Administrator',
    description: 'Centralized management for budgets and registration',
    href: '/register?role=school-leader',
    icon: '🏫',
    color: 'from-indigo-600 to-blue-600',
  },
];

export default function RoleBaseNavigationCard() {
  return (
    <section className="w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 py-14 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold tracking-widest uppercase">
            Role-Based Navigation
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Get started with your workflow
          </h2>
          <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-base sm:text-lg">
            Choose the path that matches your role and unlock tailored tools for academic success.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_CARDS.map((card) => (
            <Link
              key={card.role}
              href={card.href}
              className="group block rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-md hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r ${card.color} text-white text-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <span aria-hidden="true">{card.icon}</span>
              </div>
              <h3 className="mt-5 text-xl sm:text-2xl font-bold text-slate-900">{card.role}</h3>
              <p className="mt-3 text-slate-600 text-sm leading-relaxed">{card.description}</p>
              
              <div className="mt-5 pt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Get Started</span>
                <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
