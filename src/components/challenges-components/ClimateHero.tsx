import React from 'react'
import Image from 'next/image'

export default function ClimateHero() {
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
                KiddiesCheck for Climate Resilience
              </h1>
              
              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed max-w-lg">
                Bridging the global evidence gap. KiddiesCheck is committed to helping education systems understand and address the impacts of climate change on learning outcomes, so they can build resilience and ensure every child has the opportunity to thrive.
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
      </div>
    </section>
    </>
  )
}
