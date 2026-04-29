import React from 'react'
import Image from 'next/image'

export default function ChallengesHero() {
  return (
    <>
    <section className="w-full bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="flex flex-col justify-center space-y-6 md:space-y-8">
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Big Challenges
              </h1>
              
              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed max-w-lg">
                Helping to bridge the global KiddiesChecks evidence gap on critical global challenges, so education systems can improve learning outcomes for all.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-8 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors duration-200 shadow-lg hover:shadow-xl">
                Learn More
              </button>
              <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-900 hover:text-blue-900 transition-all duration-200">
                Explore Solutions
              </button>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/img/bigchallenge.jpg"
              alt="KiddiesChecks solutions"
              fill
              className="object-cover object-center"
              priority
            />
            {/* Overlay gradient for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 mt-16 md:mt-20 pt-12 border-t border-gray-200">
          {[
            { number: '10+', label: 'States' },
            { number: '1M+', label: 'Students Impacted' },
            { number: '100+', label: 'Research Papers' },
            { number: '10+', label: 'Year Experience' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">
                {stat.number}
              </div>
              <p className="text-sm sm:text-base text-gray-600 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
    
    {/* Big Challenges section */}
    <section className="bg-white py-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
                Big Challenges
            </h2>

            {/* Challenges List */}
            <div className="space-y-10">
                {/* Challenge 1 */}
                <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        1. Invisible Child Movement in Schools
                    </h3>
                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        Children arrive, leave, or move between caregivers with little to no real-time visibility.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why it matters:</h4>
                        <p className="text-gray-700 leading-relaxed">
                            Parents are often the last to know where their child is—especially in busy, low-resource school environments.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>KiddiesCheck provides real-time check-in and check-out tracking, instantly notifying parents when their child arrives or leaves school.</span>
                            </li>
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>Every child movement is digitally logged—no guesswork, no gaps.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Challenge 2 */}
                <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        2. Weak School-to-Parent Communication
                    </h3>
                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        Schools struggle to consistently communicate important updates to parents.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why it matters:</h4>
                        <p className="text-gray-700 leading-relaxed">
                            Missed messages can lead to safety risks, confusion, and low parental trust.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>A centralized communication system that sends automated alerts, updates, and notifications directly to parents.</span>
                            </li>
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>No reliance on paper notes or word-of-mouth.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Challenge 3 */}
                <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        3. Unsafe or Unverified Pick-Up Processes
                    </h3>
                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        Children are sometimes released to the wrong person or without proper verification.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why it matters:</h4>
                        <p className="text-gray-700 leading-relaxed">
                            This is one of the biggest safeguarding risks in schools.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>Verified pickup system using approved guardian lists and identity checks.</span>
                            </li>
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>Only authorized individuals can pick up a child—fully controlled and traceable.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Challenge 4 */}
                <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        4. Manual, Error-Prone Record Keeping
                    </h3>
                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        Attendance and movement tracking are often done on paper or informal systems.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why it matters:</h4>
                        <p className="text-gray-700 leading-relaxed">
                            Records get lost, manipulated, or inaccurately captured.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>A simple digital system that replaces paper logs with accurate, time-stamped records.</span>
                            </li>
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>Schools gain reliable data without increasing workload.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Challenge 5 */}
                <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        5. Low Parental Visibility & Trust
                    </h3>
                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        Parents don't feel confident about what happens to their children during school hours.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why it matters:</h4>
                        <p className="text-gray-700 leading-relaxed">
                            Trust is everything in education—without it, schools struggle to retain families.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>KiddiesCheck gives parents full visibility and peace of mind through instant updates and transparent records.</span>
                            </li>
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>Builds stronger school-parent relationships.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Challenge 6 */}
                <div className="border-l-4 border-blue-600 pl-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                        6. Lack of Safeguarding Systems in Low-Income Schools
                    </h3>
                    <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                        Many affordable private schools lack structured child safety systems.
                    </p>
                    <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Why it matters:</h4>
                        <p className="text-gray-700 leading-relaxed">
                            These schools serve millions of children but operate with limited infrastructure.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Our Solution:</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>A low-cost, easy-to-use safeguarding platform designed specifically for schools in emerging markets.</span>
                            </li>
                            <li className="flex items-start text-gray-700">
                                <span className="mr-3">●</span>
                                <span>Works even in low-resource environments with minimal training.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Closing Statement */}
            <div className="mt-16 pt-8 border-t border-gray-200">
                <p className="text-center text-lg font-semibold text-gray-900">
                    KiddiesCheck is building a safer school ecosystem where
                </p>
                <ul className="space-y-2 mt-4 text-center">
                    <li className="text-gray-700 text-lg"><span className="font-semibold">Every child is accounted for</span></li>
                    <li className="text-gray-700 text-lg"><span className="font-semibold">Every parent is informed</span></li>
                    <li className="text-gray-700 text-lg"><span className="font-semibold">Every school is trusted</span></li>
                </ul>
            </div>

        </div>
    </section>
    </>
  )
}
