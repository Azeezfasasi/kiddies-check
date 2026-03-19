import BlogNews from '@/components/home-component/BlogNews'
import PageTitle from '@/components/home-component/PageTitle'
import React from 'react'

export default function page() {
  return (
    <>
    <PageTitle title="Engineering Insights & News" subtitle="Stay updated with the latest trends, insights, and news in engineering and construction." />
    <BlogNews />
    </>
  )
}
