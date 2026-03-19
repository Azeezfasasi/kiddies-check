"use client";
import { useState } from "react";

export default function RequestQuote() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Thank you! Your request has been submitted.");
        setFormData({
          name: "",
          email: "",
          phone: "",
          company: "",
          service: "",
          message: "",
        });
      } else {
        setError(data.message || "Failed to submit request.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gray-50 py-16" id="request-quote">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Request a Quote
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get in touch with our team to discuss your project requirements and receive a
            detailed, no-obligation estimate.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Company Name</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Kiddies Check Ltd."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            {/* Service Type */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Select Service</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">-- Choose a Service --</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Electrical Installations">Electrical Installations</option>
                <option value="Mechanical Works">Mechanical Works</option>
                <option value="Project Management">Project Management</option>
                <option value="Consultancy">Consultancy</option>
                <option value="Fibre Deployment">Fibre Deployment</option>
                <option value="Fibre Operations">Fibre operations</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            {/* Message */}
            <div className="md:col-span-2">
              <label className="block text-gray-700 font-medium mb-2">Project Details</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="5"
                placeholder="Tell us briefly about your project..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-900"
              ></textarea>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="md:col-span-2 text-center text-red-600 font-medium">{error}</div>
            )}
            {success && (
              <div className="md:col-span-2 text-center text-green-600 font-medium">{success}</div>
            )}
            {/* Submit */}
            <div className="md:col-span-2 text-center mt-4">
              <button
                type="submit"
                className="bg-blue-900 text-white px-10 py-3 rounded-lg font-semibold shadow hover:bg-blue-800 transition cursor-pointer disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
