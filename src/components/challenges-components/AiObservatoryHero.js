'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AiObservatoryHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoplay, setIsAutoplay] = useState(true)

  const slides = [
    {
      id: 1,
      title: 'AI Observatory',
      subtitle: 'KiddiesCheck Hub',
      icon: '🔭',
      description: 'Exploring the transformative potential of artificial intelligence in education to create personalized, inclusive, and effective learning experiences for children worldwide.',
      image: '/img/bigchallenge.jpg',
    },
    {
      id: 2,
      title: 'Digital Transformation',
      subtitle: 'KiddiesCheck Hub',
      icon: '🚀',
      description: 'Empowering education systems with cutting-edge technology solutions to enhance learning outcomes and drive innovation in classrooms worldwide.',
      image: '/img/aiobs.jpg',
    },
    {
      id: 3,
      title: 'Research & Insights',
      subtitle: 'KiddiesCheck Hub',
      icon: '💡',
      description: 'Delivering evidence-based research and actionable insights to help educators and policymakers make informed decisions for better education.',
      image: '/img/kidimg1.png',
    },
  ]

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoplay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [isAutoplay, slides.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsAutoplay(false)
    // Resume autoplay after 10 seconds
    setTimeout(() => setIsAutoplay(true), 10000)
  }

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length)
  }

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length)
  }

  const slide = slides[currentSlide]

  return (
    <section className="w-full relative overflow-hidden">
      <div className="relative w-full h-screen max-h-[600px] md:max-h-[700px] lg:h-screen bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Main content */}
        <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-12">
          <div className="w-[90%] grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center mx-auto">
            {/* Left Content */}
            <div className="flex flex-col space-y-6 sm:space-y-8 text-white order-2 md:order-1">
              {/* Logo/Icon and Subtitle */}
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl">{slide.icon}</span>
                <span className="text-lg sm:text-xl font-semibold opacity-90">
                  {slide.subtitle}
                </span>
              </div>

              {/* Main Title */}
              <div className="space-y-2">
                <h1 className="text-5xl sm:text-6xl md:text-5xl lg:text-7xl font-bold leading-tight">
                  {slide.title}
                </h1>
              </div>

              {/* Description */}
              <p className="text-base sm:text-lg md:text-lg text-gray-100 leading-relaxed max-w-md">
                {slide.description}
              </p>

              {/* CTA Button */}
              <div className="pt-2">
                <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-600 transition-all duration-300 inline-flex items-center gap-2">
                  Learn more
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Right Image Section */}
            <div className="hidden relative h-80 sm:h-96 md:h-full md:flex items-center justify-center order-1 md:order-2">
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 right-32 w-24 h-24 bg-white opacity-20 rounded-full"></div>

              {/* Star decoration */}
              <div className="absolute -top-10 right-1/4 text-white opacity-30">
                <svg className="w-24 h-24 md:w-32 md:h-32" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M50 10 L61 39 L91 39 L67 57 L78 86 L50 68 L22 86 L33 57 L9 39 L39 39 Z" />
                </svg>
              </div>

              {/* Circular image frame */}
              <div className="relative w-60 h-60 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Connection lines and dots */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="absolute w-full h-full" viewBox="0 0 400 400">
                  {/* Connection lines */}
                  <line x1="280" y1="120" x2="340" y2="100" stroke="white" strokeWidth="2" opacity="0.4" />
                  <line x1="200" y1="320" x2="260" y2="360" stroke="white" strokeWidth="2" opacity="0.4" />
                  
                  {/* Dots */}
                  <circle cx="340" cy="100" r="4" fill="white" opacity="0.8" />
                  <circle cx="260" cy="360" r="6" fill="white" opacity="0.6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Left Navigation Arrow */}
          <button
            onClick={prevSlide}
            className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 rounded-full border-2 border-white text-white hover:bg-white hover:text-blue-600 flex items-center justify-center transition-all duration-300"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Right Navigation Arrow */}
          <button
            onClick={nextSlide}
            className="absolute right-4 sm:right-8 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 rounded-full border-2 border-white text-white hover:bg-white hover:text-blue-600 flex items-center justify-center transition-all duration-300"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Bottom Dots Navigation */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'w-8 h-3 bg-white'
                  : 'w-3 h-3 bg-white opacity-50 hover:opacity-75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
