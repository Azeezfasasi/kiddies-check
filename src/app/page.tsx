import React from 'react'
import Hero from '@/components/home-component/Hero'
import TestimonialsSection from '@/components/home-component/TestimonialsSection'
import SubscribeToNewsletter from '@/components/home-component/SubscribeToNewsletter'
import WhyRayob from '@/components/home-component/WhyRayob'
import RoleBaseNavigationCard from '@/components/home-component/RoleBaseNavigationCard'
import CoreFeatures from '@/components/home-component/CoreFeatures'
import VisualizeImpact from '@/components/home-component/VisualizeImpact'
import ClientsLogoSlider from '@/components/home-component/ClientsLogoSlider'
import HomeAbout from '@/components/home-component/HomeAbout'

export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeAbout />
      <RoleBaseNavigationCard />
      <CoreFeatures />
      <VisualizeImpact />
      <WhyRayob />
      <ClientsLogoSlider />
      <TestimonialsSection />
      <SubscribeToNewsletter />
    </>
  )
}
