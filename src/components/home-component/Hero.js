"use client"
import Image from 'next/image'
import Link from 'next/link'
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { ArrowBigRightDash, ArrowBigLeftDash, Loader } from 'lucide-react';

const DEFAULT_SLIDES = [
  {
    _id: '1',
    title: 'Enhanced Home-School Collaboration',
    subtitle: 'Bridge communication gaps with real-time learning analytics, alerts, and teacher feedback.',
    ctaLabel: 'Login',
    ctaHref: '/register',
    secondaryCtaLabel: 'Request a Demo',
    secondaryCtaHref: '/request-a-quote',
    image: '/images/hero-education.jpg',
    alt: 'Home school collaboration'
  }
]

export default function Hero() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState({ active: false, startX: 0, dx: 0 })
  const containerRef = useRef(null)
  const [slideWidth, setSlideWidth] = useState(0)
  const autoSlideRef = useRef(null)

  // Fetch slides from API
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const response = await fetch('/api/hero')
        const data = await response.json()
        
        if (data.success && data.slides && data.slides.length > 0) {
          // Sort by order
          const sortedSlides = [...data.slides].sort((a, b) => (a.order || 0) - (b.order || 0))
          setSlides(sortedSlides)
        } else {
          setSlides(DEFAULT_SLIDES)
        }
      } catch (error) {
        console.error('Failed to fetch hero slides:', error)
        setSlides(DEFAULT_SLIDES)
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  // pointer handlers (works for mouse & touch)
  function handlePointerDown(e) {
    const x = e.clientX ?? (e.touches && e.touches[0].clientX)
    setDrag({ active: true, startX: x, dx: 0 })
  }

  function handlePointerMove(e) {
    if (!drag.active) return
    const x = e.clientX ?? (e.touches && e.touches[0].clientX)
    if (typeof x !== 'number') return
    setDrag(d => ({ ...d, dx: x - d.startX }))
  }

  function handlePointerUp() {
    if (!drag.active) return
    const threshold = (containerRef.current?.offsetWidth || 600) * 0.15
    if (drag.dx > threshold) setIndex(i => Math.max(0, i - 1))
    else if (drag.dx < -threshold) setIndex(i => Math.min(slides.length - 1, i + 1))
    setDrag({ active: false, startX: 0, dx: 0 })
    
    // Reset auto-slide timer on manual interaction
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current)
    }
  }

  // keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIndex(i => Math.min(slides.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  // auto slide effect
  useEffect(() => {
    if (slides.length <= 1) return

    // Clear existing interval
    if (autoSlideRef.current) clearInterval(autoSlideRef.current)

    // Set up new interval for auto-slide
    autoSlideRef.current = setInterval(() => {
      setIndex(i => {
        // Loop back to start when reaching the end
        if (i >= slides.length - 1) return 0
        return i + 1
      })
    }, 5000) // Change slide every 5 seconds

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current)
    }
  }, [slides.length])

  // track container width and update on resize so we translate by exact pixels
  useLayoutEffect(() => {
    function update() {
      const w = containerRef.current?.offsetWidth || 0
      setSlideWidth(w)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  if (loading) {
    return (
      <section className="w-full">
        <div className="h-[420px] md:h-[540px] flex items-center justify-center bg-blue-50">
          <Loader className="w-8 h-8 animate-spin text-blue-900" />
        </div>
      </section>
    )
  }

  if (!slides || slides.length === 0) {
    return (
      <section className="w-full">
        <div className="h-[420px] md:h-[540px] flex items-center justify-center bg-blue-50">
          <p className="text-gray-600">No hero slides configured</p>
        </div>
      </section>
    )
  }

  return (
    <section className="w-full">
      <div className="mx-auto ">
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ touchAction: 'pan-y' }}
        >
          <div
            className="flex transition-transform duration-300"
            style={{
              transform: slideWidth
                ? `translateX(${-(index * slideWidth) + drag.dx}px)`
                : `translateX(calc(${-(index * 100)}% + ${drag.dx}px))`
            }}
          >
            {slides.map((s, i) => (
              <div key={s._id} className="min-w-full flex-none" style={{ flex: '0 0 100%' }}>
                <div className="h-[420px] md:h-[540px] flex items-center">
                  <div className="w-full h-full p-8 md:p-12 flex items-center justify-between gap-6 bg-gradient-to-br from-sky-400 to-sky-300">
                    <div className="flex-1 max-w-full md:max-w-2xl">
                      <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">{s.title}</h2>
                      <p className="text-gray-700 mb-6 text-base md:text-lg">{s.subtitle}</p>
                      <div className="flex gap-3 flex-wrap">
                        <Link href={s.ctaHref} className="inline-block px-2 md:px-5 py-3 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 transition-colors">{s.ctaLabel}</Link>
                        <Link href={s.secondaryCtaHref || '/about-us'} className="inline-block px-2 md:px-5 py-3 border border-blue-900 rounded-md text-blue-900 hover:bg-blue-50 transition-colors">{s.secondaryCtaLabel || 'Learn More'}</Link>
                      </div>
                    </div>
                    {/* Right Image - visible on lg (laptop) and up only */}
                    {s.image && (
                      <div className="hidden lg:block shrink-0 lg:w-[40%]">
                        <Image
                          src={s.image}
                          alt={s.alt || 'Slide image'}
                          width={420}
                          height={500}
                          className="rounded-2xl object-cover w-full h-[500px]"
                          priority
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Prev/Next arrows */}
          {slides.length > 1 && (
            <>
              <button
                aria-label="Previous"
                onClick={() => {
                  setIndex(i => Math.max(0, i - 1))
                  if (autoSlideRef.current) clearInterval(autoSlideRef.current)
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 md:bg-white/80 hover:bg-white p-0.5 md:p-2 rounded-full shadow-md text-blue-900 cursor-pointer transition-all"
              >
                <ArrowBigLeftDash />
              </button>
              <button
                aria-label="Next"
                onClick={() => {
                  setIndex(i => Math.min(slides.length - 1, i + 1))
                  if (autoSlideRef.current) clearInterval(autoSlideRef.current)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 md:bg-white/80 hover:bg-white p-0.5 md:p-2 rounded-full shadow-md text-blue-900 cursor-pointer transition-all"
              >
                <ArrowBigRightDash />
              </button>          

              {/* Dots */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-6 flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => {
                      setIndex(i)
                      if (autoSlideRef.current) clearInterval(autoSlideRef.current)
                    }}
                    className={`w-3 h-3 rounded-full transition-all ${i === index ? 'bg-blue-900' : 'bg-white/70 border border-gray-200'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}