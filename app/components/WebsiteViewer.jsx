'use client'

import React from 'react'

/**
 * Website Viewer Component
 * 
 * Displays a proxied website in an iframe with optional vision impairment filters applied.
 * 
 * @param {Object} props
 * @param {string} props.url - Original website URL to display
 * @param {string} props.activeFilter - Active filter ID (from filters.js)
 * @param {boolean} props.loading - Whether the website is loading
 * @param {string} props.error - Error message if loading failed
 */
export default function WebsiteViewer({ url, activeFilter = 'none', loading = false, error = null }) {
  const [iframeKey, setIframeKey] = React.useState(0)
  const iframeRef = React.useRef(null)
  
  // Build proxy URL
  const proxyUrl = url ? `/api/proxy?url=${encodeURIComponent(url)}` : null
  
  // Reload iframe when URL changes
  React.useEffect(() => {
    if (url) {
      setIframeKey(prev => prev + 1)
    }
  }, [url])
  
  return (
    <div className="website-viewer-container">
      {!url && !loading && !error && (
        <div className="empty-state">
          <p>Enter a website URL above to get started</p>
          <p className="hint">Try: wix.com, github.com, or any website you want to test</p>
        </div>
      )}
      
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading website...</p>
        </div>
      )}
      
      {error && (
        <div className="error-state" role="alert">
          <p className="error-title">Failed to load website</p>
          <p className="error-message">{error}</p>
          <p className="error-hint">
            Some websites block iframe embedding for security reasons. Try a different website.
          </p>
        </div>
      )}
      
      {proxyUrl && !loading && !error && (
        <div 
          className={`iframe-wrapper ${activeFilter !== 'none' ? 'filtered' : ''}`}
          style={{ filter: getFilterStyle(activeFilter) }}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={proxyUrl}
            title="Website preview with vision impairment filter"
            className="website-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms"
            loading="lazy"
          />
        </div>
      )}
      
      <style jsx>{`
        .website-viewer-container {
          width: 100%;
          height: 600px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: var(--spacing-xl);
          text-align: center;
        }
        
        .empty-state p {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .hint {
          margin-top: var(--spacing-sm);
          font-size: 0.9rem;
          opacity: 0.7;
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: var(--spacing-md);
        }
        
        .loading-state p {
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          padding: var(--spacing-xl);
          text-align: center;
          background: rgba(255, 107, 107, 0.1);
        }
        
        .error-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #ff6b6b;
          margin-bottom: var(--spacing-sm);
        }
        
        .error-message {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: var(--spacing-md);
        }
        
        .error-hint {
          font-size: 0.9rem;
          opacity: 0.7;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .iframe-wrapper {
          width: 100%;
          height: 100%;
          background: white;
          transition: filter var(--transition-normal);
        }
        
        .website-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        
        @media (max-width: 768px) {
          .website-viewer-container {
            height: 500px;
          }
        }
        
        @media (max-width: 480px) {
          .website-viewer-container {
            height: 400px;
          }
          
          .empty-state,
          .error-state {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Get CSS filter style for active filter
 * @param {string} filterId - Filter ID
 * @returns {string} CSS filter value
 */
function getFilterStyle(filterId) {
  // Map filter IDs to CSS filter values
  const filters = {
    none: 'none',
    protanopia: 'url(#protanopia)',
    deuteranopia: 'url(#deuteranopia)',
    tritanopia: 'url(#tritanopia)',
    achromatopsia: 'grayscale(100%)',
    cataracts: 'blur(2px) contrast(0.7) brightness(0.8)',
    lowVision: 'blur(3px)',
    lowContrast: 'contrast(0.5) brightness(0.9)',
  }
  
  return filters[filterId] || 'none'
}

