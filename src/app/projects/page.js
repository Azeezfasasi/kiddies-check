import PageTitle from '@/components/home-component/PageTitle'
import ProjectsGallery from '@/components/home-component/ProjectsGallery'
import React from 'react'

export default function page() {
  return (
    <>
        <PageTitle title="Our Projects"  subtitle="Review some of our completed projects" />
        <ProjectsGallery />
    </>
  )
}
