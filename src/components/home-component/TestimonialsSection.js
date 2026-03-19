'use client';

import { Star, Loader } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_TESTIMONIALS = [
  {
    id: 1,
    name: "John Adewale",
    position: "CEO, EduTech Solutions",
    message:
      "Kiddies Check provided exceptional educational management services that transformed our training programs. Their expertise and dedication are unmatched in the industry.",
    rating: 5,
  },
  {
    id: 2,
    name: "Maria Okafor",
    position: "Director, Future Leaders Academy",
    message:
      "The team at Kiddies Check is professional, innovative, and truly cares about the success of their clients. They helped us design a curriculum that has significantly improved our students' outcomes.",
    rating: 5,
  },
  {
    id: 3,
    name: "Engr. David Uche",
    position: "MD, Rise Schools Group",
    message:
      "Kiddies Check has been instrumental in transforming our educational approach. Their tailored solutions have significantly enhanced our students' learning experiences.",    rating: 5,  },
];

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials');
        const data = await response.json();

        if (data.success && data.testimonials) {
          const sortedTestimonials = [...data.testimonials].sort((a, b) => (a.order || 0) - (b.order || 0));
          setTestimonials(sortedTestimonials);
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        setTestimonials(DEFAULT_TESTIMONIALS);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6 lg:px-20 flex items-center justify-center min-h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-900" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from some of our satisfied clients who have trusted Kiddies Check.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial._id || testimonial.id}
              className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition"
            >
              {/* Stars */}
              <div className="flex gap-1 text-yellow-500 mb-4">
                {[...Array(testimonial.rating || 5)].map((_, i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>

              {/* Message */}
              <p className="text-gray-600 mb-6 italic">
                “{testimonial.message}”
              </p>

              {/* Author */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {testimonial.name}
                </h4>
                <p className="text-sm text-gray-500">{testimonial.position}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {/* <div className="text-center mt-12">
          <a
            href="/contact-us"
            className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-800 transition"
          >
            Work With Us
          </a>
        </div> */}
      </div>
    </section>
  );
}
