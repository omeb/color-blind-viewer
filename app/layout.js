import './globals.css'

export const metadata = {
  title: 'Colorblind Viewer - See the Web Through Different Eyes',
  description: 'Experience how people with vision impairments see websites. A tool to promote accessible web design.',
  keywords: ['accessibility', 'colorblind', 'vision impairment', 'a11y', 'WCAG', 'web design'],
  authors: [{ name: 'Colorblind Viewer Contributors' }],
  openGraph: {
    title: 'Colorblind Viewer',
    description: 'Experience how people with vision impairments see websites',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}

