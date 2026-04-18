import React from 'react'
import Link from 'next/link'

export default function FastFact() {
  const facts = [
    {
      title: 'The Challenge',
      description: `Education systems worldwide struggle with fragmented student data, inefficient communication between stakeholders, and limited visibility into learning outcomes. 
      Schools need integrated solutions that connect teachers, parents, and administrators while providing actionable insights to improve student performance.`,
    },
    {
      title: 'Our Solution',
      description: (
        <>
          <span>
            <Link href="/about-us" className="text-blue-600 hover:text-blue-800 underline font-semibold">
              Kiddies Check
            </Link>
            {' '}provides a comprehensive, unified platform that streamlines school management, enhances parent-teacher collaboration, and delivers real-time insights into student progress.{' '}
            Our intelligent system helps educators make data-driven decisions to create personalized learning experiences.
          </span>
        </>
      ),
    },
    {
      title: 'Our Impact',
      description: `We empower schools to track student progress in real-time, enable meaningful parent engagement through secure communication, provide teachers with tools for personalized instruction, 
      and help administrators optimize school operations-all in one intuitive platform that transforms education delivery.`,
    },
  ]

  return (
    <section className="w-full bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 max-w-6xl">
        {/* Section Title */}
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-12 sm:mb-16 md:mb-20">
          Fast Facts
        </h2>

        {/* Facts Grid */}
        <div className="space-y-12 sm:space-y-16 md:space-y-20">
          {facts.map((fact, index) => (
            <div key={index}>
              {/* Fact Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
                {/* Left - Title */}
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {fact.title}
                  </h3>
                </div>

                {/* Right - Description */}
                <div className="md:col-span-2">
                  <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                    {fact.description}
                  </p>
                </div>
              </div>

              {/* Divider - Hide after last item */}
              {index < facts.length - 1 && (
                <div className="border-t border-gray-200 my-12 sm:my-16 md:my-20"></div>
              )}
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 sm:mt-20 md:mt-24 pt-12 sm:pt-16 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left CTA */}
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-gray-900">
                Ready to Transform Your School?
              </h4>
              <p className="text-gray-600 text-lg">
                Join hundreds of schools already using Kiddies Check to streamline operations and improve student outcomes.
              </p>
              <Link
                href="/register"
                className="inline-block px-8 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors duration-200"
              >
                Get Started Today
              </Link>
            </div>

            {/* Right Stats */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">500+</div>
                <p className="text-gray-700 font-medium">Schools Served</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-3xl sm:text-4xl font-bold text-green-900 mb-2">100K+</div>
                <p className="text-gray-700 font-medium">Students Tracked</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-3xl sm:text-4xl font-bold text-purple-900 mb-2">50K+</div>
                <p className="text-gray-700 font-medium">Parents Connected</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-3xl sm:text-4xl font-bold text-orange-900 mb-2">24/7</div>
                <p className="text-gray-700 font-medium">Support Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
