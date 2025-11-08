import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://color-blind-viewer.netlify.app'
const siteName = 'Accessibility Viewer'
const siteDescription = 'Experience how websites appear to people with vision impairments. Test your website\'s accessibility with colorblindness, cataracts, glaucoma, and other vision condition simulators. Free tool for designers and developers.'
// Use dynamic opengraph-image route - generates 1200x630 image (required size for Facebook/WhatsApp)
const siteImage = `${siteUrl}/opengraph-image`

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Accessibility Viewer - See the World Through Different Eyes',
    template: '%s | Accessibility Viewer'
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
    title: 'Accessibility Viewer - See the World Through Different Eyes',
    description: siteDescription,
    images: [
      {
        url: siteImage,
        width: 1200,
        height: 630,
        alt: 'Accessibility Viewer - Accessibility Testing Tool',
        type: 'image/png',
        secureUrl: siteImage,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Accessibility Viewer - See the World Through Different Eyes',
    description: siteDescription,
    images: [
      {
        url: siteImage,
        alt: 'Accessibility Viewer - Accessibility Testing Tool',
      },
    ],
    creator: '@wix',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Accessibility',
  classification: 'Web Accessibility Tool',
  icons: {
    icon: '/favicon.svg',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply theme immediately to prevent flash - blocking inline script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('colorblind-viewer-theme');
                  let theme = savedTheme || 'auto';
                  
                  if (theme === 'auto') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
                  } else {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
        {/* Explicit OG meta tags for better mobile compatibility (Facebook/WhatsApp) */}
        {/* Essential Open Graph tags - must be in initial HTML, not injected by JS */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Accessibility Viewer - See the World Through Different Eyes" />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content={siteImage} />
        <meta property="og:image:url" content={siteImage} />
        <meta property="og:image:secure_url" content={siteImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Accessibility Viewer - Accessibility Testing Tool" />
        {/* Twitter Card (helps WhatsApp too) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Accessibility Viewer - See the World Through Different Eyes" />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={siteImage} />
        <meta name="twitter:image:src" content={siteImage} />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: siteName,
              description: siteDescription,
              url: siteUrl,
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              softwareVersion: '1.0',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'Wix Accessibility Team',
                url: 'https://www.wix.com',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Wix Accessibility Team',
                url: 'https://www.wix.com',
              },
              screenshot: siteImage,
              featureList: [
                'Colorblindness simulation (Protanopia, Deuteranopia, Tritanopia)',
                'Color vision deficiency filters (Protanomaly, Deuteranomaly)',
                'Vision impairment filters (Cataracts, Glaucoma, Macular Degeneration)',
                'Accessibility testing and WCAG compliance checking',
                'Real-time website preview with split-view comparison',
                'Mobile-responsive design',
                'Dark mode support',
              ],
              keywords: 'accessibility, colorblind, color blindness, vision impairment, a11y, WCAG, web accessibility, accessibility testing',
              inLanguage: 'en-US',
            }),
          }}
        />
        {/* Organization Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Wix Accessibility Team',
              url: 'https://www.wix.com',
              logo: 'https://www.wix.com/favicon.ico',
            }),
          }}
        />
        {/* WebSite Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteName,
              url: siteUrl,
              description: siteDescription,
              publisher: {
                '@type': 'Organization',
                name: 'Wix Accessibility Team',
              },
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `${siteUrl}?url={search_term_string}`,
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

