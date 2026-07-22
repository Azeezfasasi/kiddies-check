import '../globals.css'
import MainHeader from '@/components/home-component/MainHeader'
import Footer from '@/components/home-component/Footer'
import SliderMassage from '@/components/home-component/SliderMassage'
import PWARegister from '@/components/PWARegister'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'react-hot-toast';
import JsonLd from './json-ld'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://kiddiescheck.org';

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    template: '%s | KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
    default: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
  },
  description: 'KiddiesCheck is a cutting-edge child safety platform designed to provide parents and caregivers with peace of mind. Our innovative solutions include real-time location tracking, emergency alerts, and comprehensive safety resources to ensure the well-being of children in today\'s digital age.',
  keywords: ['child safety', 'digital education', 'real-time tracking', 'emergency alerts', 'safety resources', 'innovative solutions', 'technology for parents'],
  creator: 'KiddiesCheck',
  publisher: 'KiddiesCheck',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/kid.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'KiddiesCheck',
    title: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
    description: 'Cutting-edge child safety and protection solutions for parents and caregivers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
    description: 'Cutting-edge child safety and protection solutions for parents and caregivers.',
    creator: '@kiddiescheck',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
}

export function generateViewport() {
  return {
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
    themeColor: '#1f2937',
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
        <link rel="canonical" href={baseUrl} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KiddiesCheck" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/kid.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        <PWARegister />
        <PWAInstallPrompt />
        <AuthProvider>
          <SliderMassage />
          <div className="site-main-header sticky top-0 z-50">
            <MainHeader />
          </div>
          <main>{children}</main>
          <div className="site-main-header">
            <Footer />
          </div>
          <Toaster position="top-center" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  )
}

