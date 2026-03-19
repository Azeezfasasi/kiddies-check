"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Commet } from "react-loading-indicators";

const categories = ["All", "Industrial", "Residential", "Commercial"];

export default function ProjectsGalleryModal() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const res = await fetch("/api/project");
        const data = await res.json();
        setProjectsData(data.projects || []);
      } catch (err) {
        setProjectsData([]);
      }
      setLoading(false);
    }
    fetchProjects();
  }, []);

  const filteredProjects =
    selectedCategory === "All"
      ? projectsData
      : projectsData.filter((p) => p.category === selectedCategory);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4">
        {/* Category Buttons */}
        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2
              ${selectedCategory === category ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Project Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500"><Commet color="#155dfc" size="medium" text="Loading" textColor="#155dfc" /></p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">No projects found in this category.</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden"
                onClick={() => router.push(`/projects/${project._id}`)}
              >
                <div className="relative w-full h-64">
                  <Image
                    src={project.featuredImage}
                    alt={`Featured image for ${project.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 700px"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-row justify-between">
                    <span className="text-sm text-blue-900 font-semibold uppercase">
                      {project.category}
                    </span>
                    <span className="text-sm text-blue-900 font-semibold uppercase">
                    {project.location}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mt-2">{project.projectName}</h3>
                  <p className="text-gray-600 mt-2">
                    {project.projectDescription.split(" ").slice(0, 10).join(" ") + "…"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
