'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';

const DEFAULT_CONTENT = {
  title: "About Kiddies Check",
  paragraphs: [
    {
      _id: '1',
      text: "Kiddies Check is a dynamic, solutions-driven Educational and Management Company committed to delivering world-class services across multiple sectors. Established in 2020 and legally incorporated in Nigeria in 2025 with a passion for innovation, educational excellence, and sustainable project delivery.",
      order: 0,
    },
    {
      _id: '2',
      text: "We bring together nearly two decades of multidisciplinary experience spanning education, curriculum development, student services, and educational management.",
      order: 1,
    }
  ],
  image: {
    url: "/images/telecom2.jpeg",
    alt: "Kiddies Check Team",
  },
  ctaButton: {
    label: "Learn More",
    href: "/about-us",
  },
};

export default function HomeAbout() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/home-about');
        const data = await response.json();
        
        if (data.success && data.data) {
          setContent(data.data);
        } else {
          setContent(DEFAULT_CONTENT);
        }
      } catch (error) {
        console.error('Failed to fetch home about content:', error);
        setContent(DEFAULT_CONTENT);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 lg:px-20 flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-900" />
        </div>
      </section>
    );
  }

  // Sort paragraphs by order
  const sortedParagraphs = [...content.paragraphs].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 lg:px-20 flex flex-col lg:flex-row items-center gap-10">
        
        {/* Image */}
        <div className="flex-1 w-full">
          <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src={content.image?.url || "/images/telecom2.jpeg"} 
              alt={content.image?.alt || "Kiddies Check Team"}
              fill
              sizes='100%'
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            {content.title}
          </h2>
          {sortedParagraphs.map((para) => (
            <p key={para._id} className="text-gray-600 mb-6">
              {para.text}
            </p>
          ))}

          <a
            href={content.ctaButton?.href || "/about-us"}
            className="inline-block bg-blue-900 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-800 transition"
          >
            {content.ctaButton?.label || "Learn More"}
          </a>
        </div>

      </div>
    </section>
  );
}
