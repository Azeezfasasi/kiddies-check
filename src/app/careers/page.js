"use client"
import React from 'react'
import Image from 'next/image'

export default function Careers() {
  const benefits = [
    {
      title: 'Professional Growth Path',
      description: 'Opportunities for continuous learning, career advancement, and hands-on exposure to top-tier engineering and management projects.',
      icon: '📈'
    },
    {
      title: 'Collaborative Work Culture',
      description: 'We foster teamwork, respect, and open communication to ensure an inclusive and productive work environment.',
      icon: '🤝'
    },
    {
      title: 'Leadership Opportunities',
      description: 'We empower our employees to take initiative, lead project teams, and drive innovation.',
      icon: '🎯'
    },
    {
      title: 'Competitive Benefits',
      description: 'Attractive compensation, welfare programs, performance recognition, and development support.',
      icon: '💼'
    }
  ]

  const disciplines = [
    'Engineering',
    'Project Management',
    'Telecoms',
    'Civil Works',
    'Operations & Maintenance',
    'Environmental Services',
    'Administrative Management'
  ]

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Careers at Kiddies Check</h1>
          <p className="text-lg md:text-xl text-indigo-100 max-w-3xl mx-auto">
            Join a dynamic, innovation-driven company where your talent and passion can make a real impact across Engineering, Construction, Telecommunications, and Management solutions.
          </p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="order-2 lg:order-1">
              <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/images/projectplaceholder.png"
                  alt="Careers at Kiddies Check"
                  fill
                  sizes="100%"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Greatest Asset Is Our People
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  At Kiddies Check, we believe that our success is driven by the talent, dedication, and passion of our team members. We are committed to creating a work environment that fosters growth, encourages innovation, and values the contributions of every individual. Our employees are at the heart of everything we do, and we strive to provide them with the resources, support, and opportunities they need to thrive in their careers.
                </p>
                <p>
                  We provide an enabling environment where professionals can grow, contribute meaningfully, and excel in their chosen careers. Our culture values integrity, excellence, creativity, teamwork, and a relentless commitment to delivering outstanding results across all our project engagements.
                </p>
                <p className="text-blue-900 font-semibold">
                  We are not just looking for employees; we are looking for future leaders and innovators who will help us shape the future of engineering and management solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">What We Offer</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-8 text-center">
                <div className="text-5xl mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Look For Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Who We Look For</h2>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow-md p-8 md:p-12 border-l-4 border-blue-900">
              <p className="text-lg text-gray-700 leading-relaxed">
                We seek passionate, driven, and talented individuals who are eager to learn, grow, and contribute to our mission of delivering exceptional engineering and management solutions. Whether you are an experienced professional or a recent graduate, if you have the right attitude and a commitment to excellence, we want to hear from you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">We Are Hiring</h2>

          <div className="max-w-4xl mx-auto">
            <p className="text-center text-gray-700 text-lg mb-8">
              We are constantly expanding our team across various disciplines:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {disciplines.map((discipline, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                >
                  <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-gray-900">{discipline}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-lg shadow-md p-8 md:p-12 border-t-4 border-blue-900">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Apply Now</h3>
              <p className="text-gray-700 mb-6">
                Interested applicants may submit their CV and cover letter to:
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <span className="text-lg font-semibold text-blue-900">info@kiddiescheck.org</span>
                <a
                  href="mailto:info@kiddiescheck.org"
                  className="inline-flex items-center gap-2 bg-blue-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
                >
                  Send Application
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-blue-800 to-blue-900">
        <div className="container mx-auto px-6 lg:px-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Be part of a team where your contributions matter, your growth is supported, and excellence is celebrated.
          </p>
          <a
            href="mailto:info@kiddiescheck.org"
            className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-gray-50 transition"
          >
            Submit Your Application
          </a>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">Our Culture & Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {['Integrity', 'Excellence', 'Creativity', 'Teamwork', 'Results'].map((value, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center border-l-4 border-blue-900">
                <h3 className="text-lg font-bold text-gray-900">{value}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {value === 'Integrity' && 'Acting with honesty and strong principles'}
                  {value === 'Excellence' && 'Delivering outstanding results always'}
                  {value === 'Creativity' && 'Innovating and thinking differently'}
                  {value === 'Teamwork' && 'Collaborating for greater impact'}
                  {value === 'Results' && 'Committed to exceptional outcomes'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
