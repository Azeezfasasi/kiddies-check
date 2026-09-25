import OurServices from '@/components/home-component/OurServices'
import PageTitle from '@/components/home-component/PageTitle'
import React from 'react'

export const metadata = {
  title: 'Our Services - KiddiesCheck',
  description: 'Explore the range of child safety solutions and services offered by KiddiesCheck to protect children in your community.',
  openGraph: {
    title: 'Our Services - KiddiesCheck',
    description: 'Learn about the comprehensive child safety services we provide to communities.',
    url: 'https://kiddiescheck.org/services',
    type: 'website',
  },
};

export default function page() {
  return (
    <>
    <PageTitle title="Our Services" subtitle="Welcome to our services page" />
    <OurServices />
    </>
  )
}
