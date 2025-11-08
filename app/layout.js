import './globals.css'

// SSR: These constants are computed at build time and included in server-rendered HTML
// They are NOT client-side variables - WhatsApp/Facebook crawlers will see these values
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://color-blind-viewer.netlify.app'
const siteName = 'Accessibility Viewer'
const siteDescription = 'Experience how websites appear to people with vision impairments. Test your website\'s accessibility with colorblindness, cataracts, glaucoma, and other vision condition simulators. Free tool for designers and developers.'
// Use dynamic opengraph-image route - generates 1200x630 image (WhatsApp/Facebook preferred size)
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

// SSR: This component is server-rendered by default (no 'use client' directive)
// All meta tags below are included in the initial HTML response, not injected client-side
export default function RootLayout({ children }) {
  // SSR: These values are resolved at build/render time and embedded in HTML
  // WhatsApp/Facebook crawlers will see these exact values in the server-rendered HTML
  const ogTitle = 'Accessibility Viewer - See the World Through Different Eyes'
  const ogImageUrl = siteImage
  const ogUrl = siteUrl
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* CRITICAL: OG meta tags MUST be first for WhatsApp crawler compatibility */}
        {/* SSR: These tags are rendered server-side and appear in initial HTML */}
        {/* WhatsApp crawler stops parsing if it encounters scripts before meta tags */}
        {/* All values below are constants resolved at build time - no runtime dependencies */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:url" content={ogImageUrl} />
        <meta property="og:image:secure_url" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Accessibility Viewer - Accessibility Testing Tool" />
        {/* Twitter Card (helps WhatsApp too) - SSR rendered */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <meta name="twitter:image:src" content={ogImageUrl} />
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

