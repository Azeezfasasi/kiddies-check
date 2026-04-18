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
    
    {/* Our Approach section */}
    <section className="bg-white py-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-5xl mx-auto">
            
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Empowering Smarter Learning with KiddiesChecks
            </h2>

            <p className="text-gray-700 text-lg mb-6 leading-relaxed">
            At KiddiesChecks, we recognize that education technology holds immense potential to transform how children learn, grow, and succeed. However, with this opportunity comes complexity. For schools, parents, and educators, it is essential to understand what truly works and how to effectively apply technology to improve learning outcomes.
            </p>

            <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            KiddiesChecks bridges this gap by leveraging data-driven insights, artificial intelligence, and personalized learning tools to support children&apos;s academic development. Our platform focuses on performance tracking, AI-powered feedback, and seamless communication between parents and teachers.
            </p>

            <div className="mb-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Our Focus Areas
            </h3>
            <ul className="space-y-3">
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-blue-600 rounded-full"></span>
                <span className="text-gray-700">AI-driven insights for student performance and progress tracking</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-blue-600 rounded-full"></span>
                <span className="text-gray-700">Data-informed decision-making for parents and educators</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-blue-600 rounded-full"></span>
                <span className="text-gray-700">Personalized learning experiences tailored to each child</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-blue-600 rounded-full"></span>
                <span className="text-gray-700">Support for inclusive education and diverse learning needs</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-blue-600 rounded-full"></span>
                <span className="text-gray-700">Continuous teacher and parent engagement</span>
                </li>
            </ul>
            </div>

            <div className="mb-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Driving Better Educational Outcomes
            </h3>
            <p className="text-gray-700 text-lg mb-4">
                We focus on answering critical questions such as:
            </p>
            <ul className="space-y-3">
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-green-600 rounded-full"></span>
                <span className="text-gray-700">How can technology improve each child&apos;s learning outcomes?</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-green-600 rounded-full"></span>
                <span className="text-gray-700">How can parents and teachers make better decisions using real-time data?</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-green-600 rounded-full"></span>
                <span className="text-gray-700">What approaches best support personalized and effective learning?</span>
                </li>
                <li className="flex items-start">
                <span className="w-2 h-2 mt-2 mr-3 bg-green-600 rounded-full"></span>
                <span className="text-gray-700">How can schools scale solutions that consistently deliver results?</span>
                </li>
            </ul>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed">
            By addressing these questions, KiddiesChecks empowers parents, teachers, and school administrators with the tools and insights needed to make informed decisions—ensuring every child receives the support they need to thrive academically.
            </p>

        </div>
    </section>
    </>
  )
}
