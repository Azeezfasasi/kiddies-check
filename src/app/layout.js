import '../globals.css'
import MainHeader from '@/components/home-component/MainHeader'
import Footer from '@/components/home-component/Footer'
import SliderMassage from '@/components/home-component/SliderMassage'
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
  description: 'KiddiesCheck is a cutting-edge child safety platform designed to provide parents and caregivers with peace of mind. Our innovative solutions include real-time location tracking, emergency alerts, and comprehensive safety resources to ensure the well-being of children in today\'s digital age.',
  icons: {
    icon: '/kid.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
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

