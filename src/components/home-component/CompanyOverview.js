'use client';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Loader } from "lucide-react";

const DEFAULT_DATA = {
  companyInfo: {
    title: 'Who We Are',
    image: '/images/fibre1.jpeg',
    paragraphs: [
      { text: 'Kiddies Check is a dynamic, solutions-driven Educational and Management Company committed to delivering world-class services across multiple sectors. Established in 2020 and legally incorporated in Nigeria in 2025 with a passion for innovation, educational excellence, and sustainable project delivery.', order: 0 },
      { text: 'We bring together nearly two decades of multidisciplinary experience spanning education, curriculum development, student services, and educational management.', order: 1 },
      { text: 'The Chairman/CEO is strongly supported by highly experienced professionals in educational leadership, curriculum design, student affairs, and more. Together, we deliver value, promote excellence, and exceed the expectations of our clients and customers.', order: 2 },
      { text: 'Our goal: to become a trusted African leader in educational innovation, student development, and strategic project delivery.', order: 3 },
    ],
  },
  vision: {
    title: 'Our Vision',
    description: 'To be a Leading African Educational and Management Company, Renowned for Delivering Innovative, Reliable, and Cost-effective Solutions that Empower Our Clients, Inspire Excellence, and Drive Sustainable Growth Across the Education Sector.',
  },
  mission: {
    title: 'Our Mission',
    description: 'To Deliver Innovative, Reliable, and Cost-effective Educational Solutions that Empower Our Clients, Inspire Excellence, and Drive Sustainable Growth. We are committed to exceeding client expectations through our expertise, dedication, and passion for educational innovation and project management.',
  },
  coreValues: [
    { name: 'Excellence', description: 'We deliver superior outcomes in every project.', color: 'indigo', order: 0 },
    { name: 'Integrity', description: 'Ethical, transparent, and trustworthy operations.', color: 'blue', order: 1 },
    { name: 'Innovation', description: 'Smart, modern, technology-driven solutions.', color: 'green', order: 2 },
    { name: 'Professionalism', description: 'High standards, certified competence, quality delivery.', color: 'yellow', order: 3 },
    { name: 'Customer-centric', description: 'Solutions tailored to each client\'s needs.', color: 'pink', order: 4 },
  ],
};

const VALUE_COLORS = {
  indigo: 'bg-indigo-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-600',
  pink: 'bg-pink-600',
};

export default function CompanyOverview() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/company-overview');
        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch company overview:', error);
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20 flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-900" />
        </div>
      </section>
    );
  }
  return (
    <>
      {/* Company Overview Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <div className="order-2 lg:order-1">
              <div className="relative w-full h-64 sm:h-80 lg:h-[450px] rounded-xl overflow-hidden shadow-lg">
                <Image
                  src="/img/kidimg1.png"
                  alt="Kiddies Check Overview"
                  fill
                  sizes="100%"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {data.companyInfo.title}
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                {data.companyInfo.paragraphs && data.companyInfo.paragraphs.sort((a, b) => (a.order || 0) - (b.order || 0)).map((para, idx) => (
                  <p key={idx} className={idx === data.companyInfo.paragraphs.length - 1 ? "text-blue-900 font-semibold text-lg pt-2" : ""}>
                    {para.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{data.vision.title}</h2>
            <div className="bg-white rounded-lg shadow-md p-8 md:p-12 border-l-4 border-blue-900">
              <p className="text-xl text-gray-700 leading-relaxed">
                {data.vision.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 lg:px-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{data.mission.title}</h2>
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-md p-8 md:p-12 border-l-4 border-blue-900">
              <p className="text-xl text-gray-700 leading-relaxed">
                {data.mission.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">Our Core Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {data.coreValues && data.coreValues.sort((a, b) => (a.order || 0) - (b.order || 0)).map((value, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 ${VALUE_COLORS[value.color] || 'bg-indigo-600'} rounded-lg flex items-center justify-center mb-4`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{value.name}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
