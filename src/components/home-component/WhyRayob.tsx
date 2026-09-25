'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle, Zap, Target, Shield, Users, Briefcase, Handshake } from 'lucide-react'

const iconMap = {
  Zap, Target, Shield, Users, Briefcase, CheckCircle, Handshake
}

export default function WhyRayob() {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/why-rayob')
        const result = await response.json()
        if (result.success) {
          setContent(result.data)
        }
      } catch (error) {
        console.error('Error fetching WhyRayob content:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [])

  if (loading) {
    return <div className="py-16 text-center">Loading...</div>
  }

  if (!content || !content.reasons) {
    return <div className="py-16 text-center">No content available</div>
  }

  const reasons = content.reasons.map(reason => ({
    ...reason,
    icon: iconMap[reason.icon] || Zap
  })).sort((a, b) => a.order - b.order)

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            {content.heading}
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {content.subheading}
          </p>
        </div>

        {/* Reasons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {reasons.map((reason) => {
            const IconComponent = reason.icon
            return (
              <div
                key={reason.id}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 md:p-8 border border-gray-100 hover:border-blue-400"
              >
                {/* Icon and Number */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <IconComponent className="h-6 w-6 text-blue-800" />
                    </div>
                  </div>
                  <span className="flex bg-gradient-to-r from-blue-800 to-blue-900 text-white font-bold text-lg rounded-full h-8 w-8 items-center justify-center">
                    {reason.id}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">
                  {reason.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                  {reason.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        {/* <div className="mt-12 md:mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">{content.ctaHeading}</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            {content.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href={content.ctaButton1?.href || "/contact-us"}
              className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors inline-block"
            >
              {content.ctaButton1?.label || "Contact Us Today"}
            </a>
            <a 
              href={content.ctaButton2?.href || "#"}
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-800 transition-colors inline-block"
            >
              {content.ctaButton2?.label || "Learn More"}
            </a>
          </div>
        </div> */}
      </div>
    </section>
  )
}
