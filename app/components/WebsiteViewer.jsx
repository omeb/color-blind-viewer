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
 * @param {Function} props.onFilterRemove - Callback to remove active filter
 * @param {boolean} props.loading - Whether the website is loading
 * @param {string} props.error - Error message if loading failed
 */
export default function WebsiteViewer({ url, activeFilter = 'none', onFilterRemove, loading = false, error = null }) {
  const [iframeKey, setIframeKey] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isSplitView, setIsSplitView] = React.useState(false)
  const [splitPosition, setSplitPosition] = React.useState(50)
  const [isDragging, setIsDragging] = React.useState(false)
  const iframeRef = React.useRef(null)
  const containerRef = React.useRef(null)
  
  // Build proxy URL
  const proxyUrl = url ? `/api/proxy?url=${encodeURIComponent(url)}` : null
  
  // Reload iframe when URL changes
  React.useEffect(() => {
    if (url) {
      setIframeKey(prev => prev + 1)
    }
  }, [url])
  
  // Handle split view dragging
  const handleMouseDown = () => {
    setIsDragging(true)
  }
  
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSplitPosition(Math.min(Math.max(percentage, 10), 90))
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])
  
  // Screenshot function
  const handleScreenshot = async () => {
    if (!iframeRef.current) return
    
    try {
      // Since we can't directly capture iframe content due to CORS,
      // we'll capture the container with the filter applied
      const container = containerRef.current
      if (!container) return
      
      // Use html2canvas if available, or fall back to a simple approach
      alert('Screenshot feature coming soon! For now, use your browser\'s screenshot tool (Cmd/Ctrl + Shift + S)')
    } catch (err) {
      console.error('Screenshot failed:', err)
    }
  }
  
  return (
    <div 
      ref={containerRef}
      className={`website-viewer-container ${isExpanded ? 'expanded' : ''} ${isSplitView ? 'split-view' : ''}`}
      style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
    >
      {proxyUrl && !loading && !error && (
        <div className="viewer-controls">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="control-btn"
            aria-label={isExpanded ? 'Exit fullscreen view' : 'View in fullscreen'}
            title={isExpanded ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isExpanded ? '✕' : '⤢'}
          </button>
          
          {activeFilter !== 'none' && (
            <>
              <button
                onClick={() => setIsSplitView(!isSplitView)}
                className="control-btn"
                aria-label={isSplitView ? 'Exit split view' : 'Compare side-by-side'}
                title={isSplitView ? 'Exit Split View' : 'Compare Side-by-Side'}
              >
                {isSplitView ? '◫' : '◧'}
              </button>
              
              <button
                onClick={onFilterRemove}
                className="control-btn remove-filter-btn"
                aria-label="Remove filter"
                title="Remove Filter"
              >
                ✕ Filter
              </button>
            </>
          )}
          
          <button
            onClick={handleScreenshot}
            className="control-btn"
            aria-label="Take screenshot"
            title="Screenshot"
          >
            📷
          </button>
        </div>
      )}
      
      {!url && !loading && !error && (
        <div className="empty-state">
          <p>Enter a website URL above to get started</p>
          <p className="hint">Try: wix.com, github.com, or any website you want to test</p>
        </div>
      )}
      
      {loading && (
        <div className="loading-state">
          <div className="loader-container">
            <div className="loader-circles">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
            <div className="loader-bar">
              <div className="loader-bar-fill"></div>
            </div>
          </div>
          <p className="loading-text">Loading website...</p>
          <p className="loading-hint">Preparing accessibility view</p>
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
        <>
          {isSplitView && activeFilter !== 'none' ? (
            <div className="split-container">
              <div className="split-pane split-pane-left" style={{ width: `${splitPosition}%` }}>
                <div className="split-label">Original</div>
                <iframe
                  key={`${iframeKey}-original`}
                  src={proxyUrl}
                  title="Original website view"
                  className="website-iframe"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  loading="lazy"
                />
              </div>
              
              <div 
                className="split-divider"
                onMouseDown={handleMouseDown}
                style={{ left: `${splitPosition}%` }}
              >
                <div className="split-handle">⋮</div>
              </div>
              
              <div className="split-pane split-pane-right" style={{ width: `${100 - splitPosition}%` }}>
                <div className="split-label">With Filter</div>
                <div 
                  className="iframe-wrapper filtered"
                  style={{ filter: getFilterStyle(activeFilter) }}
                >
                  <iframe
                    key={`${iframeKey}-filtered`}
                    src={proxyUrl}
                    title="Filtered website view"
                    className="website-iframe"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          ) : (
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
        </>
      )}
      
      <style jsx>{`
        .website-viewer-container {
          width: 100%;
          height: 600px;
          min-height: 600px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          transition: all var(--transition-normal);
        }
        
        .website-viewer-container.expanded {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          min-height: 100vh;
          z-index: 1000;
          border-radius: 0;
        }
        
        .viewer-controls {
          position: absolute;
          top: var(--spacing-sm);
          right: var(--spacing-sm);
          z-index: 10;
          display: flex;
          gap: var(--spacing-xs);
        }
        
        .control-btn {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-sm);
          color: white;
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 1rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        
        .control-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        
        .remove-filter-btn {
          background: rgba(255, 107, 107, 0.8);
          border-color: rgba(255, 107, 107, 0.5);
        }
        
        .remove-filter-btn:hover {
          background: rgba(255, 107, 107, 1);
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
          gap: var(--spacing-lg);
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.1) 0%, rgba(147, 112, 219, 0.1) 100%);
        }
        
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-lg);
        }
        
        .loader-circles {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6EC6FF 0%, #9370DB 100%);
          animation: bounce 1.4s ease-in-out infinite;
          box-shadow: 0 0 20px rgba(110, 198, 255, 0.5);
        }
        
        .circle-1 {
          animation-delay: 0s;
        }
        
        .circle-2 {
          animation-delay: 0.2s;
        }
        
        .circle-3 {
          animation-delay: 0.4s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8) translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2) translateY(-20px);
            opacity: 1;
          }
        }
        
        .loader-bar {
          width: 200px;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        
        .loader-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6EC6FF 0%, #9370DB 50%, #6EC6FF 100%);
          background-size: 200% 100%;
          border-radius: 10px;
          animation: shimmer 1.5s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(110, 198, 255, 0.5);
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
            width: 0%;
          }
          50% {
            width: 100%;
          }
          100% {
            background-position: 200% 0;
            width: 100%;
          }
        }
        
        .loading-text {
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          font-size: 1.1rem;
          font-weight: 600;
          animation: pulse 2s ease-in-out infinite;
        }
        
        .loading-hint {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          animation: fadeInOut 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
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
        
        .split-container {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
        }
        
        .split-pane {
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .split-pane-left {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .split-label {
          position: absolute;
          top: var(--spacing-sm);
          left: var(--spacing-sm);
          z-index: 5;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          pointer-events: none;
        }
        
        .split-divider {
          position: absolute;
          top: 0;
          width: 6px;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          cursor: ew-resize;
          z-index: 10;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }
        
        .split-divider:hover {
          background: rgba(110, 198, 255, 0.5);
        }
        
        .split-handle {
          font-size: 1.5rem;
          color: white;
          text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
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

