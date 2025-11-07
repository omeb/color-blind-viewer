import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://color-blind-viewer.vercel.app'
const siteName = 'Colorblind Viewer'
const siteDescription = 'Experience how websites appear to people with vision impairments. Test your website\'s accessibility with colorblindness, cataracts, glaucoma, and other vision condition simulators. Free tool for designers and developers.'
const siteImage = `${siteUrl}/og-image.png`

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Colorblind Viewer - See the Web Through Different Eyes',
    template: '%s | Colorblind Viewer'
  },
  description: siteDescription,
  keywords: [
    'accessibility',
    'colorblind',
    'color blindness',
    'vision impairment',
    'a11y',
    'WCAG',
    'web accessibility',
    'web design',
    'color contrast',
    'accessibility testing',
    'color vision deficiency',
    'protanopia',
    'deuteranopia',
    'tritanopia',
    'cataracts',
    'glaucoma',
    'macular degeneration',
    'diabetic retinopathy',
    'accessibility checker',
    'website accessibility'
  ],
  authors: [{ name: 'Wix Accessibility Team' }],
  creator: 'Wix Accessibility Team',
  publisher: 'Wix Accessibility Team',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: 'Colorblind Viewer - See the Web Through Different Eyes',
    description: siteDescription,
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: 'Colorblind Viewer - Accessibility Testing Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Colorblind Viewer - See the Web Through Different Eyes',
    description: siteDescription,
    images: [siteImage],
    creator: '@wix',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Accessibility',
  classification: 'Web Accessibility Tool',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  other: {
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'theme-color': '#6366f1',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: siteName,
              description: siteDescription,
              url: siteUrl,
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'Wix Accessibility Team',
              },
              featureList: [
                'Colorblindness simulation',
                'Vision impairment filters',
                'Accessibility testing',
                'WCAG compliance checking',
                'Real-time website preview',
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

