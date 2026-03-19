"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Commet } from "react-loading-indicators";

export default function FeaturedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch("/api/project");
        const data = await res.json();
        // Sort by createdAt descending and take the latest 3
        const sorted = (data.projects || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setProjects(sorted.slice(0, 3));
      } catch (err) {
        setProjects([]);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Featured Projects
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore some of our key engineering projects that demonstrate
            innovation, quality, and excellence across industries.
          </p>
        </div>

        {/* Project Grid */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500"><Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" /></p>
            </div>
          ) : projects.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">No featured projects found.</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project._id}
                className="bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="relative w-full h-56">
                  <Image
                    src={project.featuredImage}
                    alt={project.projectName}
                    fill
                    sizes="20"
                    loading="eager"
                    className="object-cover"
                  />
                </div>

                <div className="p-6">
                  <span className="text-sm text-blue-900 font-semibold uppercase">
                    {project.category}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800 mt-2 mb-3">
                    {project.projectName.split(" ").slice(0, 8).join(" ") + "…"}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {project.projectDescription.split(" ").slice(0, 20).join(" ") + "…"}
                  </p>
                  <a
                    href={`/projects/${project._id}`}
                    className="text-blue-900 font-semibold hover:text-blue-800 transition"
                  >
                    View Details →
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/projects"
            className="inline-block bg-blue-900 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-800 transition"
          >
            View All Projects
          </Link>
        </div>
      </div>
    </section>
  );
}
