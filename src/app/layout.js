import '../globals.css'
import MainHeader from '@/components/home-component/MainHeader'
import Footer from '@/components/home-component/Footer'
import SliderMassage from '@/components/home-component/SliderMassage'
import PWARegister from '@/components/PWARegister'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
  description: 'KiddiesCheck is a cutting-edge child safety platform designed to provide parents and caregivers with peace of mind. Our innovative solutions include real-time location tracking, emergency alerts, and comprehensive safety resources to ensure the well-being of children in today\'s digital age.',
  manifest: '/manifest.json',
  icons: {
    icon: '/kid.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KiddiesCheck',
  },
  formatDetection: {
    telephone: false,
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#1f2937',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KiddiesCheck" />
        <meta name="theme-color" content="#1f2937" />
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

