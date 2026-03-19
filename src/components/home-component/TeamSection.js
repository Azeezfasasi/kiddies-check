'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import { Loader } from "lucide-react";

const DEFAULT_TEAM = [
  {
    name: "Engr. Chukwudi U. Afonne",
    position: "MD/CEO",
    photo: "/images/projectplaceholder.png",
  },
  {
    name: "Engr. Mary Johnson",
    position: "Head of Project Management",
    photo: "/images/projectplaceholder.png",
  },
  {
    name: "Engr. David Okoro",
    position: "Lead Civil Engineer",
    photo: "/images/projectplaceholder.png",
  },
  {
    name: "Engr. Sophia Ade",
    position: "Electrical Engineering Manager",
    photo: "/images/projectplaceholder.png",
  },
];

export default function TeamSection() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch('/api/team');
        const data = await response.json();

        if (data.success && data.members) {
          const sortedMembers = [...data.members].sort((a, b) => (a.order || 0) - (b.order || 0));
          setTeamMembers(sortedMembers);
        }
      } catch (error) {
        console.error('Failed to fetch team members:', error);
        setTeamMembers(DEFAULT_TEAM);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
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

  return (
    <section className="bg-gray-50 py-16">
      <div className="container mx-auto px-6 lg:px-20">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            Meet Our Leadership
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our team combines industry expertise, technical excellence, and dedication to deliver outstanding engineering solutions.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition overflow-hidden text-center p-6"
            >
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="100%"
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
              <p className="text-gray-500">{member.position}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
