export default function CallToAction() {
  return (
    <section className="relative bg-blue-900 text-white py-16 overflow-hidden">
      {/* Decorative Overlay */}
      <div className="absolute inset-0 bg-blue-900/40"></div>

      <div className="relative container mx-auto px-6 lg:px-20 text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Start Your Next Project?
        </h2>

        {/* Description */}
        <p className="text-blue-100 max-w-2xl mx-auto mb-8">
          Partner with <span className="font-semibold">Kiddies Check</span> for educational solutions that inspire, engage, and empower. Contact us today to discuss your project needs and discover how we can help you achieve your goals with our innovative solutions and expert project management.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a
            href="/request-quote"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg shadow hover:bg-gray-100 transition"
          >
            Request a Quote
          </a>
          <a
            href="/contact"
            className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-blue-900 transition"
          >
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
}
