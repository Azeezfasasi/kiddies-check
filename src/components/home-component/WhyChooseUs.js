import { CheckCircle } from "lucide-react";

// align the content to match Kiddies check content for why choose us.
const features = [
  {
    title: "Experienced Team",
    description: "Our team consists of highly skilled professionals with extensive experience in educational management and curriculum development, ensuring top-quality service for our clients.",
  },
  {
    title: "Innovative Solutions",
    description: "We leverage the latest technologies and innovative approaches to create customized solutions that meet the unique needs of each school and educational institution we serve.",
  },
  {
    title: "Proven Track Record",
    description: "With a strong track record of successful projects and satisfied clients, Kiddies Check has established itself as a trusted partner in the education sector.",
  },
  {
    title: "Sustainable Practices",
    description: "We are committed to sustainability and social responsibility, implementing eco-friendly practices and supporting initiatives that promote education and community development.",
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
