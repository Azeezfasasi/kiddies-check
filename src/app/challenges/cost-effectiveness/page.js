import React from 'react'
import Image from 'next/image'

export default function CostEffectiveness() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-700 via-purple-700 to-pink-700 text-white">
        <div className="absolute inset-0 opacity-10 [background:radial-gradient(circle_at_30%_20%,#fff_0%,transparent_60%),radial-gradient(circle_at_80%_10%,#fff_0%,transparent_45%),radial-gradient(circle_at_50%_90%,#fff_0%,transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="w-full lg:w-5/12">
              <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-4 sm:p-5 backdrop-blur">
                <Image
                  src="/img/kidimg1.png"
                  alt="KiddiesCheck child-focused learning illustration"
                  width={520}
                  height={320}
                  priority
                  className="h-auto w-full rounded-xl"
                />
              </div>
            </div>

            <div className="w-full lg:w-7/12">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium ring-1 ring-white/20">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-300" />
                Challenge Spotlight
              </p>

              <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Make Education Outcomes Stronger — Without Breaking Budgets
              </h1>

              <p className="mt-4 text-base sm:text-lg text-white/90 leading-relaxed">
                KiddiesCheck helps schools and partners deliver safer, more engaging learning experiences by
                prioritizing high-impact features that are practical, affordable, and easy to roll out.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="#contact"
                  className="inline-flex justify-center items-center rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-900 shadow-sm hover:bg-emerald-300 transition"
                >
                  Request a Demo
                </a>
                <a
                  href="#faq"
                  className="inline-flex justify-center items-center rounded-xl bg-white/10 px-5 py-3 font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition"
                >
                  Learn More
                </a>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{ label: 'Faster Rollout', value: 'Weeks' }, { label: 'Lower Cost', value: 'Smarter Choices' }, { label: 'Higher Trust', value: 'Real Visibility' }].map(
                  (item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-white/10 ring-1 ring-white/15 p-4 backdrop-blur"
                    >
                      <div className="text-sm text-white/85">{item.label}</div>
                      <div className="mt-1 text-lg font-bold">{item.value}</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / Overview */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-3xl font-bold">Why cost-effectiveness matters</h2>
            <p className="mt-3 text-base sm:text-lg text-slate-700 leading-relaxed">
              When budgets are tight, every decision needs to do more than look good on paper. We focus on
              practical implementations—so schools can invest in tools that improve safety, communication, and
              learning continuity.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                {
                  title: 'Smart feature selection',
                  desc: 'Prioritize the must-have capabilities parents and schools can use daily.',
                },
                {
                  title: 'Lower operational burden',
                  desc: 'Reduce manual processes with clear workflows and simple reporting.',
                },
                {
                  title: 'Sustainable adoption',
                  desc: 'Design for long-term use—not just a one-time rollout.',
                },
              ].map((x) => (
                <li key={x.title} className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white text-sm font-bold">
                    ✓
                  </span>
                  <div>
                    <div className="font-semibold">{x.title}</div>
                    <div className="text-slate-700">{x.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-200 p-6 sm:p-7">
              <h3 className="text-xl font-bold">Expected outcomes</h3>
              <p className="mt-2 text-slate-700 leading-relaxed">
                A cost-effective approach helps teams move faster and strengthen trust across students, teachers,
                and families.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ title: 'Safer Attendance', amount: 'High impact' }, { title: 'Better Communication', amount: 'Less delay' }, { title: 'Improved Engagement', amount: 'More clarity' }, { title: 'Accountability', amount: 'Transparent' }].map(
                  (card) => (
                    <div key={card.title} className="rounded-xl bg-white ring-1 ring-slate-200 p-4">
                      <div className="text-sm text-slate-500">{card.amount}</div>
                      <div className="mt-1 font-semibold">{card.title}</div>
                    </div>
                  )
                )}
              </div>

              <div className="mt-6 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-4">
                <div className="text-sm font-semibold text-emerald-900">Tip</div>
                <div className="mt-1 text-slate-700">Start small, prove results, then scale what works.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact cards */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Cost-effective building blocks</h2>
              <p className="mt-2 text-slate-700">Focused features that deliver measurable value.</p>
            </div>
            <a
              href="#contact"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Talk to our team →
            </a>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Enhanced Learning Experiences', desc: 'Support learning continuity with structured information and parent visibility.', tag: 'Education' },
              { title: 'Access to Information', desc: 'Reduce confusion with clear updates, schedules, and guidance.', tag: 'Clarity' },
              { title: 'Improved Collaboration', desc: 'Connect teachers and parents with actionable feedback loops.', tag: 'Trust' },
            ].map((x, idx) => (
              <div
                key={x.title}
                className="group rounded-2xl bg-white ring-1 ring-slate-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {x.tag}
                    </div>
                    <h3 className="mt-3 text-lg font-bold">{x.title}</h3>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                </div>
                <p className="mt-3 text-slate-700 leading-relaxed">{x.desc}</p>
                <div className="mt-5 h-1 w-14 rounded bg-gradient-to-r from-indigo-600 to-emerald-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h2 className="text-2xl sm:text-3xl font-bold">How KiddiesCheck works</h2>
        <p className="mt-2 text-slate-700">A simple, scalable approach aligned with what schools can adopt quickly.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Discover needs',
              desc: 'We align on safety priorities, workflows, and rollout timeline.',
              icon: '🔎',
            },
            {
              title: 'Deploy essentials',
              desc: 'Implement the core capabilities that deliver immediate value.',
              icon: '⚙️',
            },
            {
              title: 'Measure & improve',
              desc: 'Use feedback loops to refine outcomes and scale what works.',
              icon: '📈',
            },
          ].map((step, i) => (
            <div key={step.title} className="rounded-2xl bg-white ring-1 ring-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg">
                  {step.icon}
                </div>
                <div>
                  <div className="text-sm text-slate-500">Step {i + 1}</div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-slate-700 leading-relaxed">{step.desc}</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-600" />
                Designed for real-world adoption
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety / trust highlights */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <h2 className="text-2xl sm:text-3xl font-bold">Built for child safety & parent trust</h2>
              <p className="mt-3 text-slate-700 leading-relaxed">
                We help schools and partners communicate confidently, with clearer accountability and safer
                daily operations.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  {
                    title: 'Controlled access & verification',
                    desc: 'Reduce risk with clear identity/entry checks.',
                  },
                  {
                    title: 'Real-time visibility',
                    desc: 'Keep parents informed with timely updates.',
                  },
                  {
                    title: 'Escalation-ready reporting',
                    desc: 'Make it easier to respond when issues arise.',
                  },
                ].map((row) => (
                  <div key={row.title} className="rounded-2xl bg-white ring-1 ring-slate-200 p-5">
                    <div className="font-semibold">{row.title}</div>
                    <div className="mt-1 text-slate-700">{row.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700 text-white p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold">A measurable approach</h3>
                <p className="mt-2 text-white/90 leading-relaxed">
                  Cost-effectiveness isn’t about doing less—it’s about doing the right things first.
                </p>

                <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Implementation speed', value: 'Faster adoption' },
                    { label: 'Operational efficiency', value: 'Reduced manual effort' },
                    { label: 'Family confidence', value: 'Clear updates' },
                    { label: 'Sustainable scale', value: 'Works long-term' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-2xl bg-white/10 ring-1 ring-white/20 p-5">
                      <div className="text-sm text-white/85">{m.label}</div>
                      <div className="mt-1 text-lg font-bold">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30 p-5">
                  <div className="text-sm font-semibold text-emerald-200">Next step</div>
                  <div className="mt-1 text-white/90">Get a tailored rollout plan for your school or partner network.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14" id="faq">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="mt-2 text-slate-700">Quick answers about cost-effective implementation.</p>
          </div>
          <a href="#contact" className="text-sm font-semibold text-indigo-700 hover:text-indigo-800">
            Still have questions? →
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[{
            q: 'Is KiddiesCheck suitable for schools with limited budgets?',
            a: 'Yes. We focus on essential capabilities first, prioritize high-impact features, and provide a rollout plan that helps you achieve results quickly and sustainably.',
          },{
            q: 'How long does implementation typically take?',
            a: 'Timelines vary by organization, but most deployments start with a focused pilot—then expand after validating what works.',
          },{
            q: 'Do parents get clear visibility into what’s happening?',
            a: 'That’s the goal. We help keep parents informed with clear updates and practical workflows, so communication becomes more dependable.',
          },{
            q: 'Can the solution scale across multiple classes or campuses?',
            a: 'Yes. The approach supports structured rollout, feedback, and scaling—so improvements compound over time.',
          }].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl bg-white ring-1 ring-slate-200 p-5"
            >
              <summary className="cursor-pointer list-none flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold">
                  ?
                </span>
                <span className="font-semibold leading-relaxed">{item.q}</span>
              </summary>
              <p className="mt-3 text-slate-700 leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <h2 className="text-2xl sm:text-3xl font-bold">Request a tailored rollout plan</h2>
              <p className="mt-3 text-white/90 leading-relaxed">
                Tell us about your school, partner network, or program goals. We’ll respond with a clear, cost-effective
                approach designed for adoption and measurable outcomes.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <a
                  href="/contact-us"
                  className="inline-flex justify-center items-center rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-900 hover:bg-emerald-300 transition"
                >
                  Contact KiddiesCheck
                </a>
                <a
                  href="/request-a-quote"
                  className="inline-flex justify-center items-center rounded-xl bg-white/10 px-5 py-3 font-semibold text-white ring-1 ring-white/20 hover:bg-white/15 transition"
                >
                  Request a Quote
                </a>
              </div>

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{ title: 'Response time', value: 'Fast' }, { title: 'Rollout planning', value: 'Tailored' }, { title: 'Focus', value: 'Safety + Value' }].map((x) => (
                  <div key={x.title} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
                    <div className="text-sm text-white/80">{x.title}</div>
                    <div className="mt-1 text-lg font-bold">{x.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-6 sm:p-7">
                <h3 className="text-xl font-bold">What you’ll get</h3>
                <ul className="mt-4 space-y-3 text-white/90">
                  {[
                    'A recommended feature set for your priorities',
                    'A realistic timeline for pilot and scale',
                    'An adoption plan your team can follow',
                    'Next steps for scheduling a demo',
                  ].map((t) => (
                    <li key={t} className="flex gap-3">
                      <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-400/20 text-emerald-200 font-bold">
                        ✓
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30 p-4">
                  <div className="text-sm font-semibold text-emerald-200">Note</div>
                  <div className="mt-1 text-white/85 leading-relaxed">
                    This page provides an overview. Your plan will be customized based on your school context and rollout readiness.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

