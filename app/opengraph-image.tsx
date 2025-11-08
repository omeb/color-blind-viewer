import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Accessibility Viewer - Accessibility Testing Tool'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '40px',
            width: '100%',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            Accessibility Viewer
          </div>
          <div
            style={{
              fontSize: 36,
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              lineHeight: 1.4,
              maxWidth: '900px',
            }}
          >
            See the web through different eyes. Test your website's accessibility with vision impairment simulators.
          </div>
          <div
            style={{
              display: 'flex',
              gap: '20px',
              marginTop: '20px',
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <span>👁️</span>
            <span>🎨</span>
            <span>♿</span>
            <span>✨</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

