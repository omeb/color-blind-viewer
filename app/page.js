'use client'

import React from 'react'
import UrlInput from './components/UrlInput'
import WebsiteViewer from './components/WebsiteViewer'
import ImpairmentControls from './components/ImpairmentControls'
import InfoPanel from './components/InfoPanel'
import HistorySection from './components/HistorySection'
import FilterInfoPopover from './components/FilterInfoModal'
import DarkModeToggle from './components/DarkModeToggle'
import { generateSVGFilters, getFilter, getCategorizedFilters } from './lib/filters'

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
  const [urlInputValue, setUrlInputValue] = React.useState('')
  const [loadedUrl, setLoadedUrl] = React.useState('')
  const [activeFilter, setActiveFilter] = React.useState('tritanopia')
  const [isSplitView, setIsSplitView] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [hasLoadedSite, setHasLoadedSite] = React.useState(false)
  const [history, setHistory] = React.useState([])
  const [selectedFilterInfo, setSelectedFilterInfo] = React.useState(null)
  const [filterPopoverPosition, setFilterPopoverPosition] = React.useState(null)
  const [showFilterPopover, setShowFilterPopover] = React.useState(false)
  const [filterPopoverInfo, setFilterPopoverInfo] = React.useState(null)
  const filterPopoverRef = React.useRef(null)
  const filterInfoPopoverRef = React.useRef(null)
  const isInitialMount = React.useRef(true)
  const [isInitialDelayComplete, setIsInitialDelayComplete] = React.useState(false)
  
  // Hide all content for 0.7 seconds on initial load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialDelayComplete(true)
    }, 700)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
        // Check if click is not on the filter badge
        if (!event.target.closest('.filter-badge')) {
          setShowFilterPopover(false)
        }
      }
      if (filterInfoPopoverRef.current && !filterInfoPopoverRef.current.contains(event.target)) {
        // Check if click is not on the filter info icon button
        if (!event.target.closest('.filter-info-icon-btn')) {
          setFilterPopoverInfo(null)
        }
      }
    }
    
    if (showFilterPopover || filterPopoverInfo) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFilterPopover, filterPopoverInfo])
  
  // Close filter info popover on escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && filterPopoverInfo) {
        setFilterPopoverInfo(null)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [filterPopoverInfo])
  
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
  
  // Read query parameters on mount (after addToHistory is defined)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('url')
    const filterParam = params.get('filter')
    const splitParam = params.get('split')
    
    if (urlParam) {
      // URL is in query params - skip hero screen and load it
      setLoadedUrl(urlParam)
      setHasLoadedSite(true)
      addToHistory(urlParam)
    }
    
    if (filterParam) {
      setActiveFilter(filterParam)
    }
    
    if (splitParam === 'true' || splitParam === '1') {
      setIsSplitView(true)
    } else if (splitParam === 'false' || splitParam === '0') {
      setIsSplitView(false)
    }
    // Default is already true from useState initialization
  }, []) // Run once on mount
  
  // Update URL query parameters when state changes
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Skip initial mount to avoid overwriting query params
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    
    const newParams = new URLSearchParams()
    
    if (loadedUrl) {
      newParams.set('url', loadedUrl)
    }
    
    if (activeFilter && activeFilter !== 'none') {
      newParams.set('filter', activeFilter)
    }
    
    if (isSplitView) {
      newParams.set('split', 'true')
    }
    
    const newUrl = newParams.toString() 
      ? `${window.location.pathname}?${newParams.toString()}`
      : window.location.pathname
    
    // Update URL without page reload
    window.history.replaceState({}, '', newUrl)
  }, [loadedUrl, activeFilter, isSplitView])
  
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
  
  const handleClearQueryParams = () => {
    // Clear all state
    setLoadedUrl('')
    setHasLoadedSite(false)
    setActiveFilter('tritanopia')
    setIsSplitView(true)
    setTargetUrl('')
    setUrlInputValue('')
    setError(null)
    
    // Clear URL query params
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }
  
  // Check if there are query params
  const [hasQueryParams, setHasQueryParams] = React.useState(false)
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const checkParams = () => {
      const params = new URLSearchParams(window.location.search)
      setHasQueryParams(params.toString().length > 0)
    }
    checkParams()
  }, [loadedUrl, activeFilter, isSplitView])
  
  // Also check on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    setHasQueryParams(params.toString().length > 0)
  }, [])
  
  return (
    <>
      {!isInitialDelayComplete ? null : (
        <div className="initial-content-wrapper">
          <a href="#main-content" className="skip-link" style={{display: 'none'}}>
            Skip to main content
          </a>
          
          {/* SVG filters for colorblindness simulation */}
          <div dangerouslySetInnerHTML={{ __html: generateSVGFilters() }} />
          
          {/* Home button to clear query params */}
          {hasQueryParams && (
            <button
              onClick={handleClearQueryParams}
              className="home-button"
              aria-label="Return to home"
              title="Return to home"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </button>
          )}
          
          {/* Dark mode toggle */}
          <div className="dark-mode-toggle-wrapper">
            <DarkModeToggle />
          </div>
          
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
                <UrlInput 
                  onSubmit={handleUrlSubmit} 
                  loading={loading}
                  value={urlInputValue}
                  onValueChange={setUrlInputValue}
                />
                <HistorySection
                  history={history}
                  onSelectUrl={(url) => {
                    // Populate the input field and submit
                    setUrlInputValue(url)
                    handleUrlSubmit(url)
                  }}
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
                  onFilterInfo={(filterId, position) => {
                    setSelectedFilterInfo(filterId)
                    setFilterPopoverPosition(position)
                  }}
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
                          <div className="filter-badge-container">
                            <span 
                              className="filter-badge clickable"
                              onClick={() => setShowFilterPopover(!showFilterPopover)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  setShowFilterPopover(!showFilterPopover)
                                }
                              }}
                            >
                              {getFilterName(activeFilter)}
                            </span>
                            {activeFilter !== 'none' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  const badgeWrapper = e.currentTarget.closest('.filter-badge-wrapper')
                                  const badge = badgeWrapper?.querySelector('.filter-badge')
                                  if (badge) {
                                    const badgeRect = badge.getBoundingClientRect()
                                    setFilterPopoverInfo({ filterId: activeFilter, position: { x: badgeRect.left + badgeRect.width / 2, y: badgeRect.bottom + 8 } })
                                  }
                                }}
                                className="filter-info-icon-btn"
                                title="Show information about current filter"
                                aria-label="Show filter information"
                              >
                                ℹ
                              </button>
                            )}
                          </div>
                          <span className="filter-explanation">
                            {getFilterExplanation(activeFilter)}
                          </span>
                          {showFilterPopover && (
                            <div className="filter-picker-popover">
                              <div className="filter-picker-header">
                                <span>Select Filter</span>
                                <button
                                  onClick={() => setShowFilterPopover(false)}
                                  className="filter-picker-close"
                                  aria-label="Close"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="filter-picker-content">
                                <button
                                  onClick={() => {
                                    handleFilterChange('none')
                                    setShowFilterPopover(false)
                                  }}
                                  className={`filter-picker-item ${activeFilter === 'none' ? 'active' : ''}`}
                                >
                                  <span className="filter-picker-name">Original Site</span>
                                  <span className="filter-picker-desc">No filter applied</span>
                                </button>
                                
                                <div className="filter-picker-section-header">Color Deficiency</div>
                                {getCategorizedFilters().colorblind.map((filter) => (
                                  <button
                                    key={filter.id}
                                    onClick={() => {
                                      handleFilterChange(filter.id)
                                      setShowFilterPopover(false)
                                    }}
                                    className={`filter-picker-item ${activeFilter === filter.id ? 'active' : ''}`}
                                  >
                                    <span className="filter-picker-name">{filter.name}</span>
                                    <span className="filter-picker-desc">{filter.prevalence}</span>
                                  </button>
                                ))}
                                
                                <div className="filter-picker-section-header">Other</div>
                                {getCategorizedFilters().other.map((filter) => (
                                  <button
                                    key={filter.id}
                                    onClick={() => {
                                      handleFilterChange(filter.id)
                                      setShowFilterPopover(false)
                                    }}
                                    className={`filter-picker-item ${activeFilter === filter.id ? 'active' : ''}`}
                                  >
                                    <span className="filter-picker-name">{filter.name}</span>
                                    <span className="filter-picker-desc">{filter.prevalence}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <WebsiteViewer
                    url={loadedUrl}
                    activeFilter={activeFilter}
                    isSplitView={isSplitView}
                    onSplitViewChange={setIsSplitView}
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
              <h3 className="footer-title">Making the web accessible for everyone ✨</h3>
              <div className="footer-links">
                <a 
                  href="https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  ♿ WCAG Guidelines
                </a>
                <span className="footer-separator">·</span>
                <a 
                  href="https://github.com/omeb/color-blind-viewer" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  <svg className="footer-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p className="footer-note">
                🌐 Some sites may restrict embedding for security. Try different URLs if needed.
              </p>
            </div>
          </div>
        </footer>
        
        {/* Filter Info Popover */}
        <FilterInfoPopover
          filterId={selectedFilterInfo}
          isOpen={selectedFilterInfo !== null}
          onClose={() => {
            setSelectedFilterInfo(null)
            setFilterPopoverPosition(null)
          }}
          onApplyFilter={handleFilterChange}
          position={filterPopoverPosition}
        />
        
        {/* Filter Info Popover (from badge) */}
        {filterPopoverInfo && (() => {
          const filter = getFilter(filterPopoverInfo.filterId)
          if (!filter) return null
          
          // Helper function to get "What this means" content
          const getWhatThisMeans = (filterId) => {
            const explanations = {
              protanopia: 'People with protanopia cannot distinguish between red and green colors. Red appears darker and may be confused with black or dark gray. This affects how they perceive traffic lights, color-coded information, and design elements that rely on red-green differentiation.',
              deuteranopia: 'Deuteranopia is the most common form of color blindness. People with this condition cannot distinguish between red and green colors, similar to protanopia but caused by different cone cells. Green appears more like beige or gray, making it difficult to see green elements against certain backgrounds.',
              protanomaly: 'Protanomaly is a milder form of red colorblindness. People with this condition have reduced sensitivity to red light, making it harder to distinguish between red and green, though not as severely as protanopia.',
              deuteranomaly: 'Deuteranomaly is the most common color vision deficiency. People with this condition have reduced sensitivity to green light, making it difficult to distinguish between red and green colors, though the effect is milder than deuteranopia.',
              tritanopia: 'Tritanopia is a rare form of color blindness affecting blue-yellow color vision. People with tritanopia have difficulty distinguishing between blue and green, and between yellow and violet. Blue appears greenish, and yellow may appear pink or light gray.',
              achromatopsia: 'Achromatopsia is complete color blindness, where people see only in shades of gray. This is a rare condition that significantly impacts daily life, as all color information is lost. Designers should ensure that color is never the only way to convey important information.',
              cataracts: 'Cataracts cause clouding of the eye\'s lens, resulting in blurred, dimmed vision. Colors appear less vibrant, and there\'s reduced contrast sensitivity. This condition is common in older adults and can make text harder to read, especially with low contrast.',
              lowVision: 'Low vision refers to significantly reduced visual clarity that cannot be fully corrected with glasses or contact lenses. This includes blurred vision, making it difficult to read small text, see details, or distinguish between similar elements.',
              lowContrast: 'Low contrast sensitivity makes it difficult to distinguish between similar shades and colors. Text and elements with low contrast ratios become hard to see, which is why WCAG guidelines recommend minimum contrast ratios of 4.5:1 for text.',
              glaucoma: 'Glaucoma causes progressive vision loss, typically starting with peripheral vision. People with glaucoma experience tunnel vision, making it difficult to see content at the edges of the screen. Important information should be placed centrally.',
              macularDegeneration: 'Macular degeneration affects central vision, causing blurred or dark spots in the center of the visual field. People with this condition may have difficulty reading text and seeing fine details, especially in the center of their vision.',
              diabeticRetinopathy: 'Diabetic retinopathy can cause blurred vision, floaters, and reduced contrast sensitivity. Fluctuating vision and difficulty seeing in low light are common. High contrast and clear typography are essential.'
            }
            return explanations[filterId] || ''
          }
          
          // Helper function to get design tips
          const getDesignTips = (filterId) => {
            const isColorblind = ['protanopia', 'deuteranopia', 'protanomaly', 'deuteranomaly', 'tritanopia', 'achromatopsia'].includes(filterId)
            if (isColorblind) {
              return [
                'Never rely on color alone to convey information',
                'Use icons, patterns, or labels alongside colors',
                'Ensure sufficient contrast (minimum 4.5:1 for text)',
                'Test your designs with colorblind simulators',
                'Provide alternative ways to identify important elements'
              ]
            } else {
              return [
                'Use high contrast ratios (minimum 4.5:1 for text)',
                'Make text resizable without breaking layout',
                'Avoid small font sizes',
                'Use clear, bold typography',
                'Provide sufficient spacing between elements'
              ]
            }
          }
          
          return (
            <div 
              ref={filterInfoPopoverRef}
              className="filter-info-popover"
              style={{
                left: `${filterPopoverInfo.position.x}px`,
                top: `${filterPopoverInfo.position.y}px`,
              }}
            >
              <div className="filter-popover-header">
                <div className="filter-popover-title-row">
                  <h3 className="filter-popover-title">{filter.name}</h3>
                  {filter.severity && (
                    <span className="filter-popover-severity">{filter.severity}</span>
                  )}
                </div>
                <button
                  onClick={() => setFilterPopoverInfo(null)}
                  className="filter-popover-close"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              
              <div className="filter-popover-body">
                <p className="filter-popover-description">{filter.description}</p>
                
                <div className="filter-popover-stats">
                  <div className="filter-popover-stat">
                    <span className="stat-label">Prevalence</span>
                    <span className="stat-value">{filter.prevalence}</span>
                  </div>
                  {filter.severity && (
                    <div className="filter-popover-stat">
                      <span className="stat-label">Severity</span>
                      <span className="stat-value">{filter.severity}</span>
                    </div>
                  )}
                </div>
                
                <div className="filter-popover-section">
                  <h4>What this means</h4>
                  <p>{getWhatThisMeans(filter.id)}</p>
                </div>
                
                <div className="filter-popover-section">
                  <h4>Design Tips</h4>
                  <ul>
                    {getDesignTips(filter.id).map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })()}
      </main>
        </div>
      )}
      
      <style jsx>{`
        .initial-content-wrapper {
          animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .home-button {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1000;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .home-button:hover {
          background: rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .home-button:active {
          transform: translateY(0);
        }
        
        .home-button svg {
          width: 18px;
          height: 18px;
        }
        
        @media (max-width: 968px) {
          .home-button {
            top: 16px;
            left: 16px;
            width: 40px;
            height: 40px;
          }
          
          .home-button svg {
            width: 16px;
            height: 16px;
          }
        }
        
        .dark-mode-toggle-wrapper {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        @media (max-width: 968px) {
          .dark-mode-toggle-wrapper {
            top: 16px;
            right: 16px;
          }
        }
        
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
          color: rgba(255, 255, 255, 1);
          line-height: 1.6;
        }
        
        .hero-subtitle .highlight {
          color: #B0E0E6;
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
          padding: 0 var(--spacing-md);
          animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          animation-fill-mode: forwards;
          box-sizing: border-box;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 420px minmax(0, 1fr);
          gap: var(--spacing-lg);
          max-width: 100%;
        }
        
        
        .sidebar {
          position: sticky;
          top: var(--spacing-lg);
          height: fit-content;
          max-height: calc(100vh - 2 * var(--spacing-lg));
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
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
          min-width: 0;
          max-width: 900px;
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
        
        .filter-picker-popover {
          position: absolute;
          top: calc(100% + var(--spacing-sm));
          right: 0;
          width: 280px;
          max-width: 90vw;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: popoverFadeIn 0.2s ease-out;
          overflow: hidden;
        }
        
        .filter-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .filter-picker-header span {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .filter-picker-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          font-size: 1rem;
          line-height: 1;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .filter-picker-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .filter-picker-content {
          max-height: 400px;
          overflow-y: auto;
          padding: var(--spacing-xs);
        }
        
        .filter-picker-section-header {
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.6);
          margin-top: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
        }
        
        .filter-picker-section-header:first-of-type {
          margin-top: 0;
        }
        
        .filter-picker-item {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: none;
          border-radius: var(--radius-sm);
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          gap: 2px;
        }
        
        .filter-picker-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .filter-picker-item.active {
          background: rgba(110, 198, 255, 0.2);
          border: 1px solid rgba(110, 198, 255, 0.4);
        }
        
        .filter-picker-name {
          font-size: 0.9rem;
          font-weight: 600;
        }
        
        .filter-picker-desc {
          font-size: 0.75rem;
          opacity: 0.7;
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
        
        .footer {
          margin-top: auto;
          padding-top: var(--spacing-xl);
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
        }
        
        .footer-content {
          padding: var(--spacing-sm) var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .footer-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          text-align: center;
        }
        
        .footer-title {
          font-size: 0.9rem;
          font-weight: 600;
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.01em;
          line-height: 1.3;
        }
        
        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }
        
        .footer-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.75rem;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 0;
        }
        
        .footer-link:hover {
          color: rgba(110, 198, 255, 0.9);
        }
        
        .footer-separator {
          color: rgba(255, 255, 255, 0.25);
          font-size: 0.75rem;
          margin: 0 4px;
        }
        
        .footer-icon {
          width: 11px;
          height: 11px;
          opacity: 0.8;
        }
        
        .footer-bottom {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding-top: var(--spacing-sm);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .footer-credit {
          font-size: 0.75rem;
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .footer-credit .heart {
          display: inline-block;
          animation: heartbeat 2.5s ease-in-out infinite;
        }
        
        .footer-note {
          font-size: 0.7rem;
          margin: 0;
          color: rgba(255, 255, 255, 0.85);
          line-height: 1.4;
          text-align: center;
        }
        
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }
        
        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 380px minmax(0, 1fr);
          }
          
          .viewer-section {
            max-width: 100%;
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

