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
 * @param {Function} props.onChangeUrl - Callback to change URL
 * @param {boolean} props.loading - Whether the website is loading
 * @param {string} props.error - Error message if loading failed
 */
export default function WebsiteViewer({ url, activeFilter = 'none', onFilterRemove, onChangeUrl, loading = false, error = null }) {
  const [iframeKey, setIframeKey] = React.useState(0)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isSplitView, setIsSplitView] = React.useState(false)
  const [splitPosition, setSplitPosition] = React.useState(50)
  const [isDragging, setIsDragging] = React.useState(false)
  const [iframeLoading, setIframeLoading] = React.useState(false)
  const [iframeLoaded, setIframeLoaded] = React.useState(false)
  const iframeRef = React.useRef(null)
  const containerRef = React.useRef(null)
  
  // Build proxy URL
  const proxyUrl = url ? `/api/proxy?url=${encodeURIComponent(url)}` : null
  
  // Reload iframe when URL changes
  React.useEffect(() => {
    if (url) {
      setIframeKey(prev => prev + 1)
      setIframeLoading(true)
      setIframeLoaded(false)
    }
  }, [url])
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    // Small delay to ensure content is rendered
    setTimeout(() => {
      setIframeLoading(false)
      setIframeLoaded(true)
    }, 300)
  }
  
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
  
  // Prevent body scroll when expanded
  React.useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isExpanded])
  
  return (
    <div className={`website-viewer-wrapper ${isExpanded ? 'expanded' : ''}`}>
      {proxyUrl && !loading && !error && iframeLoaded && (
        <div className="viewer-header">
          <div className="url-display">
            <span className="url-icon">🌐</span>
            <span className="url-text">{url}</span>
            {onChangeUrl && (
              <button
                onClick={onChangeUrl}
                className="url-change-btn"
                aria-label="Change URL"
                title="Change URL"
              >
                ✎
              </button>
            )}
          </div>
          
          <div className="viewer-controls">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="control-btn"
              aria-label={isExpanded ? 'Exit fullscreen view' : 'View in fullscreen'}
              title={isExpanded ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <span className="btn-icon">{isExpanded ? '✕' : '⤢'}</span>
            </button>
            
            {activeFilter !== 'none' && (
              <>
                <button
                  onClick={() => setIsSplitView(!isSplitView)}
                  className="control-btn"
                  aria-label={isSplitView ? 'Exit split view' : 'Compare side-by-side'}
                  title={isSplitView ? 'Exit Split View' : 'Compare Side-by-Side'}
                >
                  <span className="btn-icon">{isSplitView ? '◫' : '◧'}</span>
                </button>
                
                <button
                  onClick={onFilterRemove}
                  className="control-btn remove-filter-btn"
                  aria-label="Remove filter"
                  title="Remove Filter"
                >
                  <span className="btn-icon">✕</span>
                  <span className="btn-text">Filter</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className={`website-viewer-container ${isExpanded ? 'expanded' : ''} ${isSplitView ? 'split-view' : ''}`}
        style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
      >
      
      {!url && !loading && !error && (
        <div className="empty-state">
          <p>Enter a website URL above to get started</p>
          <p className="hint">Try: wix.com, github.com, or any website you want to test</p>
        </div>
      )}
      
      {loading && (
        <div className="loading-state">
          <div className="loading-content">
            <div className="minimal-spinner"></div>
          </div>
        </div>
      )}
      
      {!loading && iframeLoading && (
        <div className="loading-state iframe-loading">
          <div className="loading-content">
            <div className="minimal-spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
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
                  onLoad={handleIframeLoad}
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
                    onLoad={handleIframeLoad}
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
                onLoad={handleIframeLoad}
              />
            </div>
          )}
        </>
      )}
      </div>
      
      <style jsx>{`
        .website-viewer-wrapper {
          position: relative;
          width: 100%;
        }
        
        .website-viewer-wrapper.expanded {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 1000;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
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
        
        .website-viewer-wrapper.expanded .website-viewer-container {
          width: 100%;
          height: 100%;
          min-height: 100%;
          border-radius: 0;
        }
        
        .viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .website-viewer-wrapper.expanded .viewer-header {
          position: fixed;
          top: var(--spacing-md);
          left: var(--spacing-md);
          right: var(--spacing-md);
          z-index: 1001;
          margin-bottom: 0;
        }
        
        .url-display {
          flex: 1;
          min-width: 200px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 6px;
          padding: 8px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .url-icon {
          font-size: 1rem;
          line-height: 1;
          flex-shrink: 0;
        }
        
        .url-text {
          flex: 1;
          font-size: 0.85rem;
          color: rgba(0, 0, 0, 0.7);
          font-family: monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.3px;
        }
        
        .url-change-btn {
          flex-shrink: 0;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 1rem;
          color: rgba(0, 0, 0, 0.6);
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 1;
        }
        
        .url-change-btn:hover {
          background: rgba(0, 0, 0, 0.15);
          color: rgba(0, 0, 0, 0.8);
        }
        
        .url-change-btn:active {
          transform: scale(0.95);
        }
        
        .viewer-controls {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }
        
        .control-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: white;
          padding: 10px 14px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .control-btn:hover {
          background: rgba(0, 0, 0, 0.95);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        
        .control-btn:active {
          transform: translateY(0);
        }
        
        .btn-icon {
          font-size: 1.1rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .btn-text {
          font-size: 0.85rem;
          letter-spacing: 0.3px;
        }
        
        .remove-filter-btn {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%);
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .remove-filter-btn:hover {
          background: linear-gradient(135deg, rgba(239, 68, 68, 1) 0%, rgba(220, 38, 38, 1) 100%);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
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
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 5;
          animation: fadeIn 0.2s ease;
        }
        
        .loading-state.iframe-loading {
          animation: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .minimal-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(110, 198, 255, 0.2);
          border-top-color: rgba(110, 198, 255, 0.9);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .loading-text {
          margin: 0;
          color: rgba(110, 198, 255, 0.9);
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: -0.2px;
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

