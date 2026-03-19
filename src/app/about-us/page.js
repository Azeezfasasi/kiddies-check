import CompanyOverview from '@/components/home-component/CompanyOverview'
import HistoryMilestones from '@/components/home-component/HistoryMilestones'
import PageTitle from '@/components/home-component/PageTitle'
import TeamSection from '@/components/home-component/TeamSection'
import WhyChooseUs from '@/components/home-component/WhyChooseUs'
import React from 'react'

export default function page() {
  return (
    <>
    <PageTitle title="About Us" subtitle="Learn more about our company and values" />
    <CompanyOverview />
    <HistoryMilestones />
    <TeamSection />
    <WhyChooseUs />
    </>
  )
}
