
export const seoMetadata = {
  title: {
    template: '%s | KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
    default: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
  },
  description: 'KiddiesCheck provides cutting-edge child safety and protection solutions for parents and caregivers. Trust us to keep your children safe, secure, and protected with innovative services.',
  keywords: [
    'child safety',
    'digital education',
    'real-time tracking',
    'emergency alerts',
    'safety resources',
    'innovative solutions',
    'technology for parents'
  ],
  creator: 'KiddiesCheck',
  publisher: 'KiddiesCheck',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icons: ['/kid.png'],
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kiddiescheck.org',
    siteName: 'KiddiesCheck',
    title: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
    description: 'Cutting-edge child safety and protection solutions for parents and caregivers. Trust us to keep your children safe, secure, and protected with innovative services.',
    images: [
      {
        url: 'https://kiddiescheck.org/kiddiesfav.png',
        width: 1200,
        height: 630,
        alt: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KiddiesCheck - Ensuring Child Safety with Innovative Solutions',
    description: 'Cutting-edge child safety and protection solutions for parents and caregivers.',
    creator: '@kiddiescheck',
    images: ['https://kiddiescheck.org/kiddiesfav.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': 'none',
      'max-image-preview': 'large',
      'max-snippet': 0,
    },
  },
  alternates: {
    canonical: 'https://kiddiescheck.org',
  },
};
