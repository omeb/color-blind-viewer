'use client'

import React from 'react'
import UrlInput from './components/UrlInput'
import WebsiteViewer from './components/WebsiteViewer'
import ImpairmentControls from './components/ImpairmentControls'
import InfoPanel from './components/InfoPanel'
import HistorySection from './components/HistorySection'
import FilterInfoModal from './components/FilterInfoModal'
import { generateSVGFilters, getFilter } from './lib/filters'

function getFilterName(filterId) {
  if (filterId === 'none') {
    return 'Original Site'
  }
  const filter = getFilter(filterId)
  return filter ? filter.name : filterId
}

function getFilterExplanation(filterId) {
  if (filterId === 'none') {
    return 'No filter applied - viewing site as-is'
  }
  const explanations = {
    protanopia: 'Cannot distinguish red from green',
    deuteranopia: 'Most common - green color blindness',
    protanomaly: 'Red-weak color vision deficiency',
    deuteranomaly: 'Green-weak - most common color deficiency',
    tritanopia: 'Blue-yellow color blindness',
    achromatopsia: 'Sees only in grayscale',
    cataracts: 'Cloudy, blurred vision',
    lowVision: 'Significantly reduced clarity',
    lowContrast: 'Difficulty seeing similar shades',
    glaucoma: 'Tunnel vision and reduced peripheral vision',
    macularDegeneration: 'Central vision loss with blurred spots',
    diabeticRetinopathy: 'Blurred vision and reduced contrast',
  }
  return explanations[filterId] || ''
}

export default function Home() {
  const [targetUrl, setTargetUrl] = React.useState('')
  const [loadedUrl, setLoadedUrl] = React.useState('')
  const [activeFilter, setActiveFilter] = React.useState('none')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [hasLoadedSite, setHasLoadedSite] = React.useState(false)
  const [history, setHistory] = React.useState([])
  const [selectedFilterInfo, setSelectedFilterInfo] = React.useState(null)
  const [showFilterPopover, setShowFilterPopover] = React.useState(false)
  const filterPopoverRef = React.useRef(null)
  
  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
        // Check if click is not on the filter badge
        if (!event.target.closest('.filter-badge')) {
          setShowFilterPopover(false)
        }
      }
    }
    
    if (showFilterPopover) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterPopover])
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('colorblind-viewer-history')
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistory(parsed)
          }
        }
      } catch (error) {
        console.error('Failed to load history from localStorage:', error)
      }
    }
  }, [])
  
  // Save history to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('colorblind-viewer-history', JSON.stringify(history))
      } catch (error) {
        console.error('Failed to save history to localStorage:', error)
      }
    }
  }, [history])
  
  const addToHistory = (url) => {
    if (!url) return
    
    // Normalize URL to avoid duplicates (www vs non-www)
    let normalizedUrl = url
    try {
      const urlObj = new URL(url)
      // Remove www. prefix for normalization
      if (urlObj.hostname.startsWith('www.')) {
        urlObj.hostname = urlObj.hostname.replace(/^www\./, '')
        normalizedUrl = urlObj.toString()
      }
    } catch (e) {
      // If URL parsing fails, use as-is
    }
    
    setHistory(prevHistory => {
      // Remove the URL if it already exists (check both www and non-www versions)
      const filtered = prevHistory.filter(item => {
        try {
          const itemObj = new URL(item)
          const normalizedItem = itemObj.hostname.replace(/^www\./, '')
          const currentObj = new URL(normalizedUrl)
          const normalizedCurrent = currentObj.hostname.replace(/^www\./, '')
          return normalizedItem !== normalizedCurrent
        } catch {
          return item !== normalizedUrl && item !== url
        }
      })
      // Add to the beginning and limit to 10 items
      const newHistory = [normalizedUrl, ...filtered].slice(0, 10)
      
      // Save immediately to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('colorblind-viewer-history', JSON.stringify(newHistory))
        } catch (error) {
          console.error('Failed to save history:', error)
        }
      }
      
      return newHistory
    })
  }
  
  const removeFromHistory = (url) => {
    setHistory(prevHistory => prevHistory.filter(item => item !== url))
  }
  
  const handleUrlSubmit = async (url) => {
    setLoading(true)
    setError(null)
    setTargetUrl(url)
    
    // Add to history
    addToHistory(url)
    
    // Simulate a brief delay to show loading state
    setTimeout(() => {
      setLoadedUrl(url)
      setLoading(false)
      setHasLoadedSite(true)
    }, 500)
  }
  
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId)
  }
  
  return (
    <>
      <a href="#main-content" className="skip-link" style={{display: 'none'}}>
        Skip to main content
      </a>
      
      {/* SVG filters for colorblindness simulation */}
      <div dangerouslySetInnerHTML={{ __html: generateSVGFilters() }} />
      
      <main id="main-content" className={`app-container ${hasLoadedSite ? 'has-content' : 'initial-view'}`}>
        {/* Hero Section - Only shown initially */}
        {!hasLoadedSite && (
          <section className="hero-section">
            <div className="glass-card-lg hero-content">
              <h1>See What Others See</h1>
              <p className="hero-subtitle">
                1 in 12 people experience color vision differences. 
                <br />
                <span className="highlight">Test your website's accessibility instantly.</span>
              </p>
              
              <div className="url-input-section">
                <UrlInput onSubmit={handleUrlSubmit} loading={loading} />
                <HistorySection
                  history={history}
                  onSelectUrl={handleUrlSubmit}
                  onRemoveUrl={removeFromHistory}
                />
              </div>
            </div>
          </section>
        )}
        
        {/* Main Content - Only shown after first site load */}
        {hasLoadedSite && (
          <div className="main-content">
            <div className="content-grid">
              {/* Left Column - Controls and Info */}
              <aside className="sidebar glass-card">
                <ImpairmentControls
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  onFilterInfo={setSelectedFilterInfo}
                />
                
              </aside>
              
              {/* Right Column - Website Viewer */}
              <section className="viewer-section">
                <div className="glass-card">
                  <div className="viewer-header">
                    <h2>Preview</h2>
                    <div className="viewer-header-actions">
                      <div className="active-filter-info">
                        <div className="filter-badge-wrapper" ref={filterPopoverRef}>
                          <span 
                            className={`filter-badge ${activeFilter !== 'none' ? 'clickable' : ''}`}
                            onClick={() => activeFilter !== 'none' && setShowFilterPopover(!showFilterPopover)}
                            role={activeFilter !== 'none' ? 'button' : undefined}
                            tabIndex={activeFilter !== 'none' ? 0 : undefined}
                            onKeyDown={(e) => {
                              if (activeFilter !== 'none' && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault()
                                setShowFilterPopover(!showFilterPopover)
                              }
                            }}
                          >
                            {getFilterName(activeFilter)}
                          </span>
                          <span className="filter-explanation">
                            {getFilterExplanation(activeFilter)}
                          </span>
                          {showFilterPopover && activeFilter !== 'none' && (
                            <div className="filter-popover">
                              <InfoPanel 
                                activeFilter={activeFilter} 
                                showHeader={false}
                                onClose={() => setShowFilterPopover(false)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <WebsiteViewer
                    url={loadedUrl}
                    activeFilter={activeFilter}
                    onFilterRemove={() => setActiveFilter('none')}
                    onFilterChange={handleFilterChange}
                    onFilterInfo={setSelectedFilterInfo}
                    onChangeUrl={() => setHasLoadedSite(false)}
                    onUrlChange={handleUrlSubmit}
                    history={history}
                    onSelectUrl={handleUrlSubmit}
                    onRemoveUrl={removeFromHistory}
                    loading={loading}
                    error={error}
                  />
                </div>
              </section>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="footer">
          <div className="glass-card footer-content">
            <div className="footer-main">
              <h3 className="footer-title">Making the web accessible for everyone</h3>
            </div>
            
            <div className="footer-divider"></div>
            
            <div className="footer-secondary">
              <p className="footer-note">
                Some sites may restrict embedding for security. Try different URLs if needed.
              </p>
              <p className="footer-love">
                Made with <span className="heart">❤️</span> by the Wix Accessibility team
                {' · '}
                <a 
                  href="https://github.com/omeb/color-blind-viewer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-link-inline"
                >
                  Open Source
                </a>
              </p>
            </div>
          </div>
        </footer>
        
        {/* Filter Info Modal */}
        <FilterInfoModal
          filterId={selectedFilterInfo}
          isOpen={selectedFilterInfo !== null}
          onClose={() => setSelectedFilterInfo(null)}
          onApplyFilter={handleFilterChange}
        />
      </main>
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .app-container.initial-view {
          justify-content: center;
          align-items: center;
        }
        
        .app-container.has-content {
          justify-content: flex-start;
        }
        
        .hero-section {
          width: 100%;
          max-width: 900px;
          opacity: 1;
          transform: scale(1);
        }
        
        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          padding: var(--spacing-xl) var(--spacing-lg);
        }
        
        h1 {
          font-size: 3.5rem;
          margin-bottom: var(--spacing-lg);
        }
        
        .hero-subtitle {
          font-size: 1.25rem;
          margin-bottom: calc(var(--spacing-xl) * 1.5);
          opacity: 0.95;
          line-height: 1.6;
        }
        
        .hero-subtitle .highlight {
          color: #6EC6FF;
          font-weight: 600;
        }
        
        .url-input-section {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .main-content {
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: var(--spacing-lg);
        }
        
        
        .sidebar {
          position: sticky;
          top: var(--spacing-lg);
          height: fit-content;
          max-height: calc(100vh - 2 * var(--spacing-lg));
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        
        .sidebar .glass-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 600px;
        }
        
        .viewer-section {
          min-height: 600px;
          display: flex;
          flex-direction: column;
        }
        
        .viewer-section .glass-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 600px;
        }
        
        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }
        
        .viewer-header-actions {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .viewer-header h2 {
          margin: 0;
        }
        
        .active-filter-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          align-items: flex-end;
        }
        
        .filter-badge {
          padding: var(--spacing-xs) var(--spacing-md);
          background: rgba(110, 198, 255, 0.25);
          border: 1px solid rgba(110, 198, 255, 0.5);
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-light);
          text-transform: capitalize;
        }
        
        .filter-explanation {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          font-style: italic;
        }
        
        .filter-badge-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          align-items: flex-end;
        }
        
        .filter-badge.clickable {
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .filter-badge.clickable:hover {
          background: rgba(110, 198, 255, 0.35);
          border-color: rgba(110, 198, 255, 0.7);
          transform: translateY(-1px);
        }
        
        .filter-popover {
          position: absolute;
          top: calc(100% + var(--spacing-sm));
          right: 0;
          width: 400px;
          max-width: 90vw;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: popoverFadeIn 0.2s ease-out;
        }
        
        @keyframes popoverFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .filter-popover :global(.info-panel) {
          margin: 0;
        }
        
        .filter-popover :global(.glass-card) {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        
        .footer {
          margin-top: auto;
          padding-top: var(--spacing-xl);
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        
        .footer-content {
          padding: var(--spacing-lg) var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .footer-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .footer-title {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.01em;
        }
        
        .footer-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #6EC6FF;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: 6px;
          background: rgba(110, 198, 255, 0.08);
          border: 1px solid rgba(110, 198, 255, 0.15);
          transition: all var(--transition-fast);
        }
        
        .footer-link:hover {
          background: rgba(110, 198, 255, 0.15);
          border-color: rgba(110, 198, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.2);
        }
        
        .footer-link-icon {
          font-size: 0.7rem;
        }
        
        .footer-divider {
          width: 50px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          margin: var(--spacing-xs) auto;
        }
        
        .footer-secondary {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          opacity: 0.7;
        }
        
        .footer-note {
          font-size: 0.8rem;
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }
        
        .footer-love {
          font-size: 0.85rem;
          margin: 0;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .footer-love .heart {
          display: inline-block;
          animation: heartbeat 3s ease-in-out infinite;
        }
        
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 300px 1fr;
          }
        }
        
        @media (max-width: 968px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .sidebar {
            position: static;
            max-height: none;
          }
          
          h1 {
            font-size: 2.5rem;
          }
        }
        
        @media (max-width: 768px) {
          .app-container {
            padding: var(--spacing-md);
          }
          
          h1 {
            font-size: 2.25rem;
          }
          
          .hero-subtitle {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </>
  )
}

