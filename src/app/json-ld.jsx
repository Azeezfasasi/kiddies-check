/**
 * JsonLd component injects structured data (JSON-LD) for the Kiddies Check organization into the page,
 * improving SEO and enabling rich search results. Place this component in your main layout or head section.
 */
export default function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Kiddies Check',
    alternateName: 'Kiddies Check',
    url: 'https://kiddiescheck.org',
    logo: 'https://kiddiescheck.org/kiddiesfav.png',
    description: 'Kiddies Check is a cutting-edge child safety platform designed to provide parents and caregivers with peace of mind. Our innovative solutions include real-time location tracking, emergency alerts, and comprehensive safety resources to ensure the well-being of children in today\'s digital age.',
    sameAs: [
      'https://www.facebook.com/kiddiescheck',
      'https://www.twitter.com/kiddiescheck',
      'https://www.instagram.com/kiddiescheck',
      'https://www.linkedin.com/company/kiddiescheck',
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NG',
      addressRegion: 'Lagos',
      addressLocality: 'Lagos',
      streetAddress: 'Lagos, Nigeria',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      telephone: '+2348167675104',
      email: 'info@kiddiescheck.org',
    },
    foundingDate: '2021-04-04',
    founders: [
      {
        '@type': 'Person',
        name: 'Oluwatosin Oyelakin',
      },
      {
        '@type': 'Person',
        name: 'Azeez Fasasi',
      },
    ],
    knowsAbout: [
      'Child Safety',
      'Real-Time Tracking',
      'Innovative Solutions',
      'Technology Solutions',
      'Digital Education',
      'Innovation Solutions',
      'Technology Solutions',
      'Digital Education',
      'Child Safety',
      'Real-Time Tracking',
      'Emergency Alerts',
    ],
    knowsLanguage: ['en'],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }}
    />
  );
}
