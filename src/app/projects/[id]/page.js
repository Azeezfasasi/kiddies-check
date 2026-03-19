"use client";
import ProjectDetails from "@/components/home-component/ProjectDetails";
import { useParams } from "next/navigation";

export default function ProjectDetailsPage() {
  const params = useParams();
  return <ProjectDetails projectId={params.id} />;
}
