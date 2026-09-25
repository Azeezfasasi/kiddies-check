import React from 'react'
import Link from 'next/link'

export default function FastFact() {
  return (
    <section className="w-full bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl">
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-12 sm:mb-16 md:mb-20">
          AI Observatory
        </h2>

        {/* Main Intro */}
        <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-12 max-w-4xl">
          KiddiesCheck's AI Observatory is the intelligence layer that quietly works in the background analyzing patterns, flagging risks, and helping schools act before issues escalate.
        </p>

        {/* The Problem Section */}
        <div className="mb-16 pb-16 border-b border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">The Problem</h3>
          <p className="text-lg text-gray-700 mb-6 leading-relaxed">
            Schools collect data every day—attendance, performance records, late pickups, unusual movements—but nothing connects the dots.
          </p>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">What this leads to:</h4>
            <ul className="space-y-2">
              <li className="flex items-start text-gray-700 text-lg">
                <span className="mr-3">●</span>
                <span>Warning signs are missed</span>
              </li>
              <li className="flex items-start text-gray-700 text-lg">
                <span className="mr-3">●</span>
                <span>Safeguarding risks go unnoticed</span>
              </li>
              <li className="flex items-start text-gray-700 text-lg">
                <span className="mr-3">●</span>
                <span>Decisions are reactive, not proactive</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Our Approach Section */}
        <div className="mb-16 pb-16 border-b border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Our Approach</h3>
          <p className="text-lg text-gray-700 mb-6 font-semibold">We don't just collect data, we make it useful.</p>
          <ul className="space-y-3">
            <li className="flex items-start text-gray-700 text-lg">
              <span className="mr-3">●</span>
              <span>The AI Observatory analyzes real-time and historical data to identify patterns that humans might miss.</span>
            </li>
            <li className="flex items-start text-gray-700 text-lg">
              <span className="mr-3">●</span>
              <span>It turns routine school activity into actionable insights for safety, accountability, and decision-making.</span>
            </li>
          </ul>
        </div>

        {/* What It Does Section */}
        <div className="mb-16 pb-16 border-b border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">What It Does</h3>
          <div className="space-y-8">
            {/* Feature 1 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h4 className="text-2xl font-semibold text-gray-900 mb-3">1. Detects Risk Patterns</h4>
              <p className="text-gray-700 text-lg mb-3">Flags unusual behavior like:</p>
              <ul className="space-y-2">
                <li className="flex items-start text-gray-700 text-lg">
                  <span className="mr-3">●</span>
                  <span>Frequent late pickups</span>
                </li>
                <li className="flex items-start text-gray-700 text-lg">
                  <span className="mr-3">●</span>
                  <span>Irregular attendance patterns</span>
                </li>
                <li className="flex items-start text-gray-700 text-lg">
                  <span className="mr-3">●</span>
                  <span>Unusual pickup changes</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h4 className="text-2xl font-semibold text-gray-900 mb-3">2. Generates Smart Alerts</h4>
              <p className="text-gray-700 text-lg">Not just notifications, but intelligent alerts based on risk signals. Schools and parents get notified when something needs attention, not just when something happens.</p>
            </div>

            {/* Feature 3 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h4 className="text-2xl font-semibold text-gray-900 mb-3">3. Builds Child Safety Profiles</h4>
              <p className="text-gray-700 text-lg">Each child has a dynamic safety profile built over time. This helps schools understand what's normal and quickly spot what's not.</p>
            </div>

            {/* Feature 4 */}
            <div className="border-l-4 border-blue-600 pl-6">
              <h4 className="text-2xl font-semibold text-gray-900 mb-3">4. Supports Better Decisions</h4>
              <p className="text-gray-700 text-lg">School leaders get simple dashboards powered by insights, not raw data. From safeguarding to operations, decisions become faster and more accurate.</p>
            </div>
          </div>
        </div>

        {/* Why It Matters Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Why It Matters</h3>
          <ul className="space-y-3">
            <li className="flex items-start text-gray-700 text-lg">
              <span className="mr-3">●</span>
              <span>Schools move from reactive to proactive</span>
            </li>
            <li className="flex items-start text-gray-700 text-lg">
              <span className="mr-3">●</span>
              <span>Strengthens child protection systems</span>
            </li>
            <li className="flex items-start text-gray-700 text-lg">
              <span className="mr-3">●</span>
              <span>Builds trust through transparency and intelligence</span>
            </li>
          </ul>
        </div>

        {/* Closing Statement */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg">
          <p className="text-center text-xl font-semibold text-gray-900">
            We don't just track children, we understand patterns, predict risks, and help schools stay one step ahead.
          </p>
        </div>
      </div>
    </section>
  )
}
