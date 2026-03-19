import React from 'react'
import Hero from '@/components/home-component/Hero'
import OurServices from '@/components/home-component/OurServices'
import HomeAbout from '@/components/home-component/HomeAbout'
import FeaturedProjects from '@/components/home-component/FeaturedProjects'
import TestimonialsSection from '@/components/home-component/TestimonialsSection'
import CallToAction from '@/components/home-component/CallToAction'
import RequestQuote from '@/components/home-component/RequestQuote'
import ClientsLogoSlider from '@/components/home-component/ClientsLogoSlider'
import SubscribeToNewsletter from '@/components/home-component/SubscribeToNewsletter'
import WhyRayob from '@/components/home-component/WhyRayob'
import RoleBaseNavigationCard from '@/components/home-component/RoleBaseNavigationCard'
import CoreFeatures from '@/components/home-component/CoreFeatures'
import VisualizeImpact from '@/components/home-component/VisualizeImpact'

export default function HomePage() {
  return (
    <>
      <Hero />
      <RoleBaseNavigationCard />
      <CoreFeatures />
      <VisualizeImpact />
      <TestimonialsSection />
      <SubscribeToNewsletter />
    </>
  )
}
