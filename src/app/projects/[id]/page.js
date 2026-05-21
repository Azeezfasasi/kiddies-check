import React from 'react';
import ProjectDetails from '@/components/home-component/ProjectDetails';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kiddiescheck.org';

// Server-side metadata generation
export async function generateMetadata({ params }) {
  try {
    const response = await fetch(`${baseUrl}/api/project`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) throw new Error('Failed to fetch projects');
    
    const data = await response.json();
    const projects = Array.isArray(data) ? data : data.projects || [];
    const project = projects.find(p => p._id.toString() === params.id);
    
    if (!project) {
      return {
        title: 'Project Not Found | KiddiesCheck',
        description: 'The project you are looking for does not exist.',
        robots: { index: false },
      };
    }
    
    const projectUrl = `${baseUrl}/projects/${params.id}`;
    const description = project.projectDescription?.substring(0, 160) || project.projectName;
    const image = project.featuredImage;
    
    return {
      title: `${project.projectName} | KiddiesCheck Projects`,
      description: description,
      keywords: [
        project.category,
        'project',
        ...(project.technologies || []),
        ...(project.tags || []),
      ].filter(Boolean),
      openGraph: {
        type: 'website',
        title: project.projectName,
        description: description,
        url: projectUrl,
        siteName: 'KiddiesCheck',
        images: image ? [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: project.projectName,
            type: 'image/jpeg',
          }
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: project.projectName,
        description: description,
        creator: '@kiddiescheck',
        images: image ? [image] : undefined,
      },
      alternates: {
        canonical: projectUrl,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Project | KiddiesCheck',
      description: 'View our latest project.',
    };
  }
}

// Generate static paths
export async function generateStaticParams() {
  try {
    const response = await fetch(`${baseUrl}/api/project`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const projects = Array.isArray(data) ? data : data.projects || [];
    
    return projects.map((project) => ({
      id: project._id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function ProjectDetailsPage({ params }) {
  return <ProjectDetails projectId={params.id} />;
}
