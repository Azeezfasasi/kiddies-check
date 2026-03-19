import { CheckCircle } from "lucide-react";

const features = [
  {
    title: "Expert Engineering Team",
    description: "Our team consists of certified professionals with extensive experience across industrial, commercial, and residential projects.",
  },
  {
    title: "Innovative Solutions",
    description: "We apply the latest technology and best practices to deliver innovative and cost-effective engineering solutions.",
  },
  {
    title: "On-Time Delivery",
    description: "We pride ourselves on meeting deadlines without compromising quality, ensuring client satisfaction on every project.",
  },
  {
    title: "Sustainable Practices",
    description: "We implement sustainable engineering practices that minimize environmental impact and maximize efficiency.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Why Choose Kiddies Check?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover the key reasons why Kiddies Check stands out as a trusted partner for educational management and curriculum development services.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition p-6 text-center"
            >
              <CheckCircle className="mx-auto text-blue-900 mb-4" size={40} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
