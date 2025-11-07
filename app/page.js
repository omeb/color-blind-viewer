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
  const filter = getFilter(filterId)
  return filter ? filter.name : filterId
}

function getFilterExplanation(filterId) {
  const explanations = {
    protanopia: 'Cannot distinguish red from green',
    deuteranopia: 'Most common - green color blindness',
    tritanopia: 'Blue-yellow color blindness',
    achromatopsia: 'Sees only in grayscale',
    cataracts: 'Cloudy, blurred vision',
    lowVision: 'Significantly reduced clarity',
    lowContrast: 'Difficulty seeing similar shades',
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
  
  // Load history from localStorage on mount
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
                
                <div className="mt-lg">
                  {history.length > 0 && (
                    <HistorySection
                      history={history}
                      onSelectUrl={handleUrlSubmit}
                      onRemoveUrl={removeFromHistory}
                    />
                  )}
                </div>
              </aside>
              
              {/* Right Column - Website Viewer */}
              <section className="viewer-section">
                <div className="glass-card">
                  <div className="viewer-header">
                    <h2>Preview</h2>
                    {activeFilter !== 'none' && (
                      <div className="active-filter-info">
                        <span className="filter-badge">
                          {getFilterName(activeFilter)}
                        </span>
                        <span className="filter-explanation">
                          {getFilterExplanation(activeFilter)}
                        </span>
                      </div>
                    )}
                  </div>
                  <WebsiteViewer
                    url={loadedUrl}
                    activeFilter={activeFilter}
                    onFilterRemove={() => setActiveFilter('none')}
                    onFilterChange={handleFilterChange}
                    onFilterInfo={setSelectedFilterInfo}
                    onChangeUrl={() => setHasLoadedSite(false)}
                    onUrlChange={handleUrlSubmit}
                    loading={loading}
                    error={error}
                  />
                  {activeFilter !== 'none' && (
                    <div className="viewer-info-section">
                      <InfoPanel activeFilter={activeFilter} />
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="footer">
          <div className="glass-card footer-content">
            <p>
              Making the web accessible for everyone.{' '}
              <a 
                href="https://github.com/omeb/color-blind-viewer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                Open Source on GitHub
              </a>
            </p>
            <p className="footer-note">
              Some sites may restrict embedding for security. Try different URLs if needed.
            </p>
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
        }
        
        .viewer-section {
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
        
        .viewer-info-section {
          margin-top: var(--spacing-md);
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .viewer-info-section :global(.info-panel) {
          margin: 0;
        }
        
        .viewer-info-section :global(.glass-card) {
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
          text-align: center;
          padding: var(--spacing-lg);
        }
        
        .footer-content p {
          margin: var(--spacing-xs) 0;
        }
        
        .footer-link {
          color: #6EC6FF;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color var(--transition-fast);
        }
        
        .footer-link:hover {
          border-bottom-color: #6EC6FF;
        }
        
        .footer-note {
          font-size: 0.85rem;
          opacity: 0.8;
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

