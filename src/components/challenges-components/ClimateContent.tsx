import React from 'react'

export default function ClimateContent() {
  return (
    <section className="w-full bg-white py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 max-w-5xl">
        
        {/* Main Heading */}
        <h2 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
          High-Impact Child Safety Without High Costs
        </h2>

        {/* Content Sections */}
        <div className="space-y-8 text-gray-700 text-lg leading-relaxed">
          
          {/* First Paragraph */}
          <p>
            Most schools, especially affordable private schools, are doing their best with limited resources. They are expected to keep children safe, maintain accurate records, and communicate effectively with parents—yet they often rely on paper logs, manual processes, and fragmented systems that quietly drain time, introduce errors, and increase risk. In this reality, safety can start to feel like an expensive upgrade instead of a basic standard.
          </p>

          {/* Second Paragraph */}
          <p>
            KiddiesCheck changes that equation. Instead of adding another cost layer, it replaces multiple inefficiencies with one simple, affordable system. What schools used to manage through paper attendance, scattered communication, and informal pickup processes is brought into a single, streamlined platform that works with tools they already have—basic smartphones and internet access. There is no need for heavy infrastructure, expensive hardware, or complex setup.
          </p>

          {/* Third Paragraph */}
          <p>
            By automating check-ins, check-outs, parent notifications, and record keeping, KiddiesCheck frees up valuable staff time and reduces costly human errors. Schools spend less time chasing information and more time focusing on teaching and care. As the school grows, the system grows with it—supporting more students without requiring a proportional increase in cost or complexity.
          </p>

          {/* Fourth Paragraph */}
          <p>
            At its core, cost effectiveness is not just about spending less, it's about getting more value from every resource. KiddiesCheck makes child safety practical, scalable, and sustainable, ensuring that even the most budget-conscious schools can operate with the structure, visibility, and confidence they need.
          </p>

          {/* Closing Statement */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-8 rounded-lg mt-12">
            <p className="text-center text-xl font-semibold text-gray-900">
              You don't need expensive systems to protect children, just a smarter one.
            </p>
          </div>

        </div>

      </div>
    </section>
  )
}
