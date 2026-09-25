import CompanyOverview from '@/components/home-component/CompanyOverview'
import HistoryMilestones from '@/components/home-component/HistoryMilestones'
import PageTitle from '@/components/home-component/PageTitle'
import TeamSection from '@/components/home-component/TeamSection'
import WhyChooseUs from '@/components/home-component/WhyChooseUs'
import React from 'react'

export const metadata = {
  title: 'About Us - KiddiesCheck',
  description: 'Learn about KiddiesCheck, our mission, values, and the team dedicated to providing professional child safety solutions for communities.',
  openGraph: {
    title: 'About Us - KiddiesCheck',
    description: 'Discover who we are and our commitment to child safety.',
    url: 'https://kiddiescheck.org/about-us',
    type: 'website',
  },
};

export default function page() {
  return (
    <>
    <PageTitle title="About Us" subtitle="Learn more about our company and values" link="/about-us" label="About Us" />
    <CompanyOverview />
    <HistoryMilestones />
    <TeamSection />
    <WhyChooseUs />
    </>
  )
}
