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
  const [activeFilter, setActiveFilter] = React.useState('deuteranopia')
  const [isSplitView, setIsSplitView] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [hasLoadedSite, setHasLoadedSite] = React.useState(false)
  const [history, setHistory] = React.useState([])
  const [selectedFilterInfo, setSelectedFilterInfo] = React.useState(null)
  const [filterPopoverPosition, setFilterPopoverPosition] = React.useState(null)
  const [showFilterPopover, setShowFilterPopover] = React.useState(false)
  const [isPopoverOpening, setIsPopoverOpening] = React.useState(false)
  const [filterPopoverInfo, setFilterPopoverInfo] = React.useState(null)
  const [popoverPosition, setPopoverPosition] = React.useState(null)
  const filterPopoverRef = React.useRef(null)
  const loadingTimeoutRef = React.useRef(null)
  const isLoadingRef = React.useRef(false)
  const filterInfoPopoverRef = React.useRef(null)
  const infoIconRef = React.useRef(null)
  const filterPickerContentRef = React.useRef(null)
  const activeFilterItemRef = React.useRef(null)
  const isInitialMount = React.useRef(true)
  const isClearingQueryParams = React.useRef(false)
  const [isInitialDelayComplete, setIsInitialDelayComplete] = React.useState(false)
  const [isSidebarVisible, setIsSidebarVisible] = React.useState(false)
  const heroUrlInputRef = React.useRef(null)
  const viewerUrlInputRef = React.useRef(null)
  
  // Global keyboard listener: focus URL input when user starts typing
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere if:
      // - User is already typing in an input/textarea
      // - A modal/popover is open
      // - User is pressing modifier keys (Ctrl/Cmd/Ctrl+Alt for shortcuts)
      // - It's a special key (Escape, Tab, Arrow keys, etc.)
      const activeElement = document.activeElement
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      )
      
      const isModalOpen = filterPopoverInfo || showFilterPopover || selectedFilterInfo
      
      const isModifierKey = e.ctrlKey || e.metaKey || e.altKey
      
      // Guard against undefined key (can happen with browser autocomplete)
      if (!e.key) {
        return
      }
      
      const isSpecialKey = [
        'Escape', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 
        'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 
        'PageDown', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 
        'F7', 'F8', 'F9', 'F10', 'F11', 'F12'
      ].includes(e.key)
      
      // Only focus if:
      // - It's a printable character (length === 1)
      // - No input is focused
      // - No modal is open
      // - No modifier keys
      // - Not a special key
      if (
        e.key.length === 1 &&
        !isInputFocused &&
        !isModalOpen &&
        !isModifierKey &&
        !isSpecialKey
      ) {
        e.preventDefault()
        
        // Focus the appropriate input based on whether site is loaded
        if (hasLoadedSite && viewerUrlInputRef.current) {
          viewerUrlInputRef.current.focus()
        } else if (!hasLoadedSite && heroUrlInputRef.current) {
          heroUrlInputRef.current.focus()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasLoadedSite, filterPopoverInfo, showFilterPopover, selectedFilterInfo])
  
  // Check if sidebar is visible based on viewport width
  React.useEffect(() => {
    const checkSidebarVisibility = () => {
      // Sidebar is visible on screens wider than 1200px (matches CSS media query)
      setIsSidebarVisible(window.innerWidth > 1200 && hasLoadedSite)
    }
    
    checkSidebarVisibility()
    window.addEventListener('resize', checkSidebarVisibility)
    
    return () => {
      window.removeEventListener('resize', checkSidebarVisibility)
    }
  }, [hasLoadedSite])
  
  // Prevent body scroll on mobile when popover is open
  React.useEffect(() => {
    if (!filterPopoverInfo) return
    
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [filterPopoverInfo])
  
  // Recalculate popover position after it's rendered
  React.useEffect(() => {
    if (!filterPopoverInfo) {
      setPopoverPosition(null)
      return
    }
    
    const calculatePosition = () => {
      if (!filterInfoPopoverRef.current) return
      
      // Skip positioning on mobile - it's full screen
      const isMobile = window.innerWidth <= 768
      if (isMobile) {
        setPopoverPosition({ x: 0, y: 0 })
        return
      }
      
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const minMargin = 20
      
      // Get actual popover dimensions (accounts for responsive widths)
      const actualWidth = filterInfoPopoverRef.current.offsetWidth || 240
      const actualHeight = filterInfoPopoverRef.current.offsetHeight || 500
      
      let x = filterPopoverInfo.position.x
      let y = filterPopoverInfo.position.y
      
      // Ensure popover doesn't overflow right edge
      if (x + actualWidth / 2 > viewportWidth - minMargin) {
        x = viewportWidth - actualWidth / 2 - minMargin
      }
      
      // Ensure popover doesn't overflow left edge
      if (x - actualWidth / 2 < minMargin) {
        x = actualWidth / 2 + minMargin
      }
      
      // Ensure popover doesn't overflow bottom edge
      if (y + actualHeight > viewportHeight - minMargin) {
        y = viewportHeight - actualHeight - minMargin
      }
      
      // Ensure popover doesn't go above viewport
      if (y < minMargin) {
        y = minMargin
      }
      
      // On very small screens, center horizontally if popover is wider than viewport
      if (actualWidth + (minMargin * 2) > viewportWidth) {
        x = viewportWidth / 2
      }
      
      setPopoverPosition({ x, y })
    }
    
    // Wait for DOM to be ready, then calculate position
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calculatePosition()
      })
    })
    
    // Recalculate on window resize
    const handleResize = () => {
      calculatePosition()
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [filterPopoverInfo])
  
  // Hide all content for 0.7 seconds on initial load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialDelayComplete(true)
    }, 700)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Handle popover opening with smooth scroll
  const handleOpenFilterPopover = () => {
    setShowFilterPopover(true)
    setIsPopoverOpening(true)
    
    // Use double requestAnimationFrame to ensure DOM is ready and rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Set scroll position immediately (synchronously, before visual transition)
        if (activeFilterItemRef.current && filterPickerContentRef.current) {
          const activeItem = activeFilterItemRef.current
          const contentContainer = filterPickerContentRef.current
          
          // Calculate and set scroll position instantly
          const scrollPosition = 
            activeItem.offsetTop - 
            (contentContainer.clientHeight / 2) + 
            (activeItem.offsetHeight / 2)
          
          // Set scroll synchronously to prevent any visual jump
          contentContainer.scrollTop = Math.max(0, scrollPosition)
        }
        
        // After scroll is set, trigger the visual transition
        // Use a tiny delay to ensure scroll is applied
        setTimeout(() => {
          setIsPopoverOpening(false)
        }, 0)
      })
    })
  }
  
  const handleCloseFilterPopover = () => {
    setIsPopoverOpening(false)
    setShowFilterPopover(false)
  }
  
  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target)) {
        // Check if click is not on the filter control buttons
        if (!event.target.closest('.filter-controls-toggle')) {
          handleCloseFilterPopover()
        }
      }
      if (filterInfoPopoverRef.current && !filterInfoPopoverRef.current.contains(event.target)) {
        // Check if click is not on the filter info icon button
        if (!event.target.closest('.filter-control-info-btn')) {
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
      // Don't handle Escape if user is editing URL input
      const activeElement = document.activeElement
      const isEditingUrl = activeElement && (
        activeElement.classList.contains('url-edit-input') ||
        activeElement.closest('.url-edit-form')
      )
      
      if (isEditingUrl) {
        // Let the input handle Escape itself
        return
      }
      
      if (e.key === 'Escape' && filterPopoverInfo) {
        setFilterPopoverInfo(null)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [filterPopoverInfo])
  
  // Load history from localStorage on mount and when returning to initial screen
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
  }, []) // Load once on mount
  
  // Reload history when returning to initial screen
  React.useEffect(() => {
    if (!hasLoadedSite && typeof window !== 'undefined') {
      try {
        const savedHistory = localStorage.getItem('colorblind-viewer-history')
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHistory(parsed)
          }
        }
      } catch (error) {
        console.error('Failed to reload history from localStorage:', error)
      }
    }
  }, [hasLoadedSite])
  
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
    
    // Skip if we're clearing query params
    if (isClearingQueryParams.current) {
      isClearingQueryParams.current = false
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
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    
    isLoadingRef.current = true
    setLoading(true)
    setError(null)
    setTargetUrl(url)
    setUrlInputValue(url) // Update input value
    
    // If navigating from initial screen, set default filter and split view
    if (!hasLoadedSite) {
      setActiveFilter('deuteranopia')
      setIsSplitView(true)
    }
    
    // Add to history
    addToHistory(url)
    
    // Set up timeout to retry if loading takes too long
    loadingTimeoutRef.current = setTimeout(() => {
      // Check if still loading using ref
      if (isLoadingRef.current) {
        console.warn('Loading timeout - retrying navigation')
        // Retry navigation after clearing timeout
        loadingTimeoutRef.current = null
        handleUrlSubmit(url)
      }
    }, 4000) // 4 seconds
    
    // Pre-fetch the proxy URL to check for errors
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      // Clear timeout since we got a response
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      
      isLoadingRef.current = false
      
      // Check if response is JSON (error) or HTML (success)
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        // It's a JSON error response
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load website')
        // Keep loadedUrl and hasLoadedSite set so the URL input remains visible
        setLoadedUrl(url)
        setHasLoadedSite(true)
        setLoading(false)
        return
      }
      
      if (!response.ok) {
        setError(`Failed to fetch website: ${response.status} ${response.statusText}`)
        // Keep loadedUrl and hasLoadedSite set so the URL input remains visible
        setLoadedUrl(url)
        setHasLoadedSite(true)
        setLoading(false)
        return
      }
      
      // Success - set the loaded URL
      setLoadedUrl(url)
      setLoading(false)
      setHasLoadedSite(true)
    } catch (fetchError) {
      // Clear timeout since we got an error
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      
      isLoadingRef.current = false
      
      console.error('Error fetching website:', fetchError)
      // Keep loadedUrl and hasLoadedSite set so the URL input remains visible
      setLoadedUrl(url)
      setHasLoadedSite(true)
      if (fetchError.name === 'AbortError') {
        setError('Request timeout: Website took too long to respond')
      } else if (fetchError.message?.includes('network') || fetchError.message?.includes('fetch')) {
        setError('Network error: Could not connect to the website')
      } else {
        setError('Failed to load website. Please try again')
      }
      setLoading(false)
    }
  }
  
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId)
  }
  
  const handleClearQueryParams = () => {
    // Set flag to skip useEffect that updates query params
    isClearingQueryParams.current = true
    
    // Clear all state
    setLoadedUrl('')
    setHasLoadedSite(false)
    setActiveFilter('none')
    setIsSplitView(false)
    setTargetUrl('')
    setUrlInputValue('')
    setError(null)
    setHistory([])
    
    // Clear URL query params immediately
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
          
          {/* Top Navigation Bar */}
          {hasLoadedSite && (
            <nav className="top-nav-bar" aria-label="Main navigation">
              <div className="top-nav-content">
                {/* Home button */}
                <div className="top-nav-left">
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
                </div>
                
                {/* Filter controls */}
                <div className="filter-controls-toggle" ref={filterPopoverRef}>
                <button
                  onClick={() => showFilterPopover ? handleCloseFilterPopover() : handleOpenFilterPopover()}
                  className="filter-control-btn"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      showFilterPopover ? handleCloseFilterPopover() : handleOpenFilterPopover()
                    }
                  }}
                  title="Select filter"
                  aria-label="Select filter"
                >
                  {getFilterName(activeFilter)}
                </button>
                {activeFilter !== 'none' && (
                  <button
                    ref={(el) => {
                      if (el) {
                        infoIconRef.current = el
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const iconRect = e.currentTarget.getBoundingClientRect()
                      setFilterPopoverInfo({ 
                        filterId: activeFilter, 
                        position: { 
                          x: iconRect.left + iconRect.width / 2, 
                          y: iconRect.bottom + 8 
                        } 
                      })
                    }}
                    className="filter-control-info-btn"
                    title="Show information about current filter"
                    aria-label="Show filter information"
                    type="button"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M7 5V7M7 9H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                {showFilterPopover && (
                  <div 
                    className="filter-picker-popover" 
                    data-open={!isPopoverOpening}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="filter-picker-header">
                      <span>Select Filter</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleCloseFilterPopover()
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                        }}
                        className="filter-picker-close"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="filter-picker-content" ref={filterPickerContentRef}>
                      <button
                        ref={activeFilter === 'none' ? activeFilterItemRef : null}
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleFilterChange('none')
                          handleCloseFilterPopover()
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`filter-picker-item ${activeFilter === 'none' ? 'active' : ''}`}
                      >
                        <span className="filter-picker-name">Original Site</span>
                        <span className="filter-picker-desc">No filter applied</span>
                      </button>
                      
                      <div className="filter-picker-section-header">Color Deficiency</div>
                      {getCategorizedFilters().colorblind.map((filter) => (
                        <button
                          key={filter.id}
                          ref={activeFilter === filter.id ? activeFilterItemRef : null}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleFilterChange(filter.id)
                            handleCloseFilterPopover()
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
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
                          ref={activeFilter === filter.id ? activeFilterItemRef : null}
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleFilterChange(filter.id)
                            handleCloseFilterPopover()
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
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
            </nav>
          )}
          
          <main id="main-content" className={`app-container ${hasLoadedSite ? 'has-content' : 'initial-view'}`}>
        {/* Hero Section - Only shown initially */}
        {!hasLoadedSite && (
          <section className="hero-section">
            <div className="glass-card-lg hero-content">
              <h1>See What Others See</h1>
              <p className="hero-subtitle">
                1 in 12 people experience color vision differences
                <br />
                <span className="highlight">Test your website's accessibility instantly</span>
              </p>
              
              <div className="url-input-section">
                <UrlInput 
                  ref={heroUrlInputRef}
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
                  hideRecent={loading}
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
                      // Use the same fullscreen modal as the top info icon
                      setFilterPopoverInfo({
                        filterId: filterId,
                        position: {
                          x: position.x,
                          y: position.y
                        }
                      })
                    }}
                />
                
              </aside>
              
              {/* Right Column - Website Viewer */}
              <section className="viewer-section">
                <div className="glass-card">
                  <div className="viewer-header">
                    <div className="viewer-header-content">
                      <h2>Preview</h2>
                      <p className="viewer-subtitle">See the web through different eyes</p>
                    </div>
                  </div>
                  <WebsiteViewer
                    ref={viewerUrlInputRef}
                    url={loadedUrl}
                    activeFilter={activeFilter}
                    isSplitView={isSplitView}
                    onSplitViewChange={setIsSplitView}
                    onFilterRemove={() => setActiveFilter('none')}
                    onFilterChange={handleFilterChange}
                    onFilterInfo={(filterId, position) => {
                      // Use the same fullscreen modal as the top info icon
                      setFilterPopoverInfo({
                        filterId: filterId,
                        position: {
                          x: position.x,
                          y: position.y
                        }
                      })
                    }}
                    onChangeUrl={() => setHasLoadedSite(false)}
                    onUrlChange={handleUrlSubmit}
                    onFocusUrlInput={() => {
                      if (viewerUrlInputRef.current) {
                        viewerUrlInputRef.current.focus()
                      }
                    }}
                    history={history}
                    onSelectUrl={handleUrlSubmit}
                    onRemoveUrl={removeFromHistory}
                    loading={loading}
                    error={error}
                    showQuickFilters={!isSidebarVisible}
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
                  <span className="footer-link-emoji">♿</span><span className="footer-link-text"> WCAG Guidelines</span>
                </a>
              </div>
              <div className="footer-theme-toggle">
                <DarkModeToggle />
              </div>
            </div>
            
            <div className="footer-bottom">
              <p className="footer-note">
                <span className="footer-note-text">
                  Some sites may restrict embedding for security<br />
                  Try different URLs if needed
                </span>
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
          
          const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
          
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
            <>
              {isMobile && (
                <div 
                  className="filter-popover-backdrop"
                  onClick={() => setFilterPopoverInfo(null)}
                  aria-hidden="true"
                />
              )}
              <div 
                ref={filterInfoPopoverRef}
                className="filter-info-popover"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                style={isMobile ? {
                  opacity: 1,
                  visibility: 'visible',
                } : (popoverPosition ? {
                  left: `${popoverPosition.x}px`,
                  top: `${popoverPosition.y}px`,
                  transform: 'translateX(-50%)',
                } : {
                  opacity: 0,
                  visibility: 'hidden',
                })}
              >
              <div className="filter-popover-header">
                <div className="filter-popover-title-row">
                  <h3 className="filter-popover-title">{filter.name}</h3>
                  {filter.severity && (
                    <span className="filter-popover-severity">{filter.severity}</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setFilterPopoverInfo(null)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
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
            </>
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
        
        .top-nav-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .top-nav-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 12px var(--spacing-lg);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .top-nav-left {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          min-width: 40px;
        }
        
        .top-nav-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          text-align: center;
          letter-spacing: -0.01em;
          line-height: 1.2;
          white-space: nowrap;
          justify-self: center;
        }
        
        .home-button {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: none;
        }
        
        .home-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.25);
          color: rgba(255, 255, 255, 1);
          transform: translateY(-1px);
        }
        
        .home-button:active {
          transform: translateY(0);
        }
        
        .home-button svg {
          width: 18px;
          height: 18px;
        }
        
        @media (max-width: 968px) {
          .top-nav-content {
            padding: 10px var(--spacing-md);
            gap: var(--spacing-sm);
          }
          
          .top-nav-title {
            font-size: 0.9rem;
          }
          
          .home-button {
            width: 36px;
            height: 36px;
          }
          
          .home-button svg {
            width: 16px;
            height: 16px;
          }
        }
        
        @media (max-width: 600px) {
          .top-nav-title {
            font-size: 0.85rem;
          }
        }
        
        .filter-controls-toggle {
          display: flex;
          align-items: center;
          gap: 0;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 3px;
          position: relative;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .filter-control-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          padding: 6px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .filter-control-btn:hover {
          color: rgba(255, 255, 255, 1);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .filter-control-info-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
          min-width: 32px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .filter-control-info-btn svg {
          width: 14px;
          height: 14px;
          display: block;
        }
        
        .filter-control-info-btn:hover {
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.1);
        }
        
        .filter-control-info-btn:active {
          transform: scale(0.95);
        }
        
        @media (max-width: 968px) {
          .filter-control-btn {
            padding: 6px 10px;
            font-size: 0.8rem;
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
          padding-top: calc(var(--spacing-lg) + 60px);
        }
        
        @media (max-width: 968px) {
          .app-container.has-content {
            padding-top: calc(var(--spacing-md) + 56px);
          }
        }
        
        @media (max-width: 768px) {
          .app-container.has-content {
            padding-top: calc(var(--spacing-md) + 52px);
          }
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
          margin-bottom: var(--spacing-lg);
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
          width: 100%;
        }
        
        .url-input-section .history-section {
          display: block;
          visibility: visible;
          opacity: 1;
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
        
        @media (max-width: 768px) {
          .main-content {
            padding: 0;
          }
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
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
          width: 100%;
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
          max-width: 100%;
        }
        
        .viewer-section .glass-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 600px;
        }
        
        .viewer-section .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
          gap: var(--spacing-sm);
        }
        
        .viewer-section .viewer-header-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }
        
        .viewer-section .viewer-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.98);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        
        .viewer-section .viewer-subtitle {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.7);
          letter-spacing: -0.01em;
          line-height: 1.4;
        }
        
        @media (max-width: 768px) {
          .viewer-section .viewer-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
          }
          
          .viewer-section .viewer-header h2 {
            font-size: 1.25rem;
          }
          
          .viewer-section .viewer-subtitle {
            font-size: 0.8rem;
          }
          
          .viewer-section .glass-card {
            padding: var(--spacing-sm);
            border-radius: var(--radius-md);
          }
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
          overflow: hidden;
          opacity: 0;
          transform: translateY(-8px) scale(0.98);
          transition: opacity 0.15s ease-out, transform 0.15s ease-out;
          pointer-events: none;
        }
        
        .filter-picker-popover[data-open="true"] {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
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
        
        .filter-info-popover {
          position: fixed;
          width: 240px;
          max-width: 240px;
          max-height: calc(100vh - 200px);
          z-index: 1000;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: popoverFadeIn 0.2s ease-out;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        @media (min-width: 1024px) {
          .filter-info-popover {
            width: 360px;
            max-width: 360px;
            max-height: calc(100vh - 120px);
          }
        }
        
        @media (min-width: 1440px) {
          .filter-info-popover {
            width: 420px;
            max-width: 420px;
          }
        }
        
        .filter-popover-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-xs) var(--spacing-sm);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-header {
            padding: var(--spacing-sm) var(--spacing-md);
          }
        }
        
        .filter-popover-title-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }
        
        .filter-popover-title {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        
        @media (min-width: 1024px) {
          .filter-popover-title {
            font-size: 1rem;
          }
        }
        
        .filter-popover-severity {
          padding: 2px 6px;
          background: rgba(110, 198, 255, 0.15);
          border: 1px solid rgba(110, 198, 255, 0.3);
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 600;
          color: rgba(110, 198, 255, 1);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-severity {
            padding: 4px 8px;
            font-size: 0.75rem;
          }
        }
        
        .filter-popover-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          font-size: 0.9rem;
          line-height: 1;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-close {
            width: 24px;
            height: 24px;
            font-size: 1rem;
          }
        }
        
        .filter-popover-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .filter-popover-body {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
          overflow-x: hidden;
          padding: var(--spacing-xs);
          flex: 1;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-body {
            padding: var(--spacing-sm) var(--spacing-md);
            max-height: calc(100vh - 220px);
          }
        }
        
        .filter-popover-body::-webkit-scrollbar {
          width: 6px;
        }
        
        .filter-popover-body::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .filter-popover-body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .filter-popover-body::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .filter-popover-description {
          margin: 0 0 var(--spacing-xs) 0;
          padding: 0 var(--spacing-xs);
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-description {
            padding: 0;
            font-size: 0.875rem;
            line-height: 1.6;
            margin-bottom: var(--spacing-sm);
          }
        }
        
        .filter-popover-stats {
          display: flex;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
          padding: 0 var(--spacing-xs);
          flex-wrap: wrap;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-stats {
            padding: 0;
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-sm);
          }
        }
        
        .filter-popover-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .filter-popover-stat .stat-label {
          font-size: 0.6rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          font-weight: 500;
        }
        
        .filter-popover-stat .stat-value {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        
        @media (min-width: 1024px) {
          .filter-popover-stat .stat-label {
            font-size: 0.7rem;
          }
          
          .filter-popover-stat .stat-value {
            font-size: 0.875rem;
          }
        }
        
        .filter-popover-section {
          margin-bottom: var(--spacing-sm);
          padding: 0 var(--spacing-xs);
        }
        
        .filter-popover-section:last-child {
          margin-bottom: 0;
        }
        
        .filter-popover-section h4 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: 0.65rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
        
        .filter-popover-section p {
          margin: 0;
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-section {
            padding: 0;
            margin-bottom: var(--spacing-md);
          }
          
          .filter-popover-section h4 {
            font-size: 0.75rem;
            margin-bottom: var(--spacing-sm);
          }
          
          .filter-popover-section p {
            font-size: 0.875rem;
            line-height: 1.6;
          }
        }
        
        .filter-popover-section ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        
        .filter-popover-section ul li {
          position: relative;
          padding-left: 16px;
          margin-bottom: var(--spacing-xs);
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }
        
        .filter-popover-section ul li:before {
          content: '✓';
          position: absolute;
          left: 0;
          top: 0;
          color: rgba(110, 198, 255, 1);
          font-weight: 600;
          font-size: 0.7rem;
        }
        
        @media (min-width: 1024px) {
          .filter-popover-section ul li {
            padding-left: 20px;
            margin-bottom: var(--spacing-sm);
            font-size: 0.875rem;
            line-height: 1.6;
          }
          
          .filter-popover-section ul li:before {
            font-size: 0.875rem;
          }
        }
        
        .filter-popover-section ul li:last-child {
          margin-bottom: 0;
        }
        
        .filter-popover-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 999;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .filter-info-popover {
            width: 100vw;
            max-width: 100vw;
            height: 100vh;
            max-height: 100vh;
            min-width: 0;
            left: 0 !important;
            top: 0 !important;
            transform: none !important;
            border-radius: 0;
            border: none;
            display: flex;
            flex-direction: column;
            animation: slideUpMobile 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
          }
          
          @keyframes slideUpMobile {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .filter-popover-header {
            padding: var(--spacing-md) var(--spacing-lg);
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            flex-shrink: 0;
            position: sticky;
            top: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            z-index: 10;
          }
          
          .filter-popover-title {
            font-size: 1.5rem;
            font-weight: 700;
          }
          
          .filter-popover-severity {
            padding: 6px 12px;
            font-size: 0.875rem;
            border-radius: 8px;
          }
          
          .filter-popover-close {
            width: 44px;
            height: 44px;
            font-size: 1.5rem;
            padding: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            transition: all 0.2s ease;
          }
          
          .filter-popover-close:hover,
          .filter-popover-close:active {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
          }
          
          .filter-popover-body {
            padding: var(--spacing-lg);
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            max-height: none;
          }
          
          .filter-popover-description {
            font-size: 1rem;
            line-height: 1.6;
            margin-bottom: var(--spacing-md);
            padding: 0;
            color: rgba(255, 255, 255, 0.9);
            font-weight: 500;
          }
          
          .filter-popover-stats {
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-lg);
            padding: var(--spacing-md);
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            flex-wrap: wrap;
          }
          
          .filter-popover-stat {
            gap: 6px;
            min-width: 120px;
          }
          
          .filter-popover-stat .stat-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.6);
          }
          
          .filter-popover-stat .stat-value {
            font-size: 1rem;
            font-weight: 700;
            color: rgba(255, 255, 255, 1);
          }
          
          .filter-popover-section {
            margin-bottom: var(--spacing-lg);
            padding: 0;
          }
          
          .filter-popover-section:last-child {
            margin-bottom: 0;
          }
          
          .filter-popover-section h4 {
            font-size: 0.875rem;
            margin-bottom: var(--spacing-sm);
            color: rgba(110, 198, 255, 1);
            font-weight: 700;
          }
          
          .filter-popover-section p {
            font-size: 1rem;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: var(--spacing-sm);
          }
          
          .filter-popover-section ul {
            margin-top: var(--spacing-sm);
          }
          
          .filter-popover-section ul li {
            padding-left: 28px;
            margin-bottom: var(--spacing-md);
            font-size: 1rem;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.9);
            position: relative;
          }
          
          .filter-popover-section ul li:before {
            font-size: 1.125rem;
            left: 4px;
            top: 2px;
          }
          
          .filter-popover-section ul li:last-child {
            margin-bottom: 0;
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
          color: rgba(255, 255, 255, 1);
          text-decoration: none;
          font-size: 0.75rem;
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 0;
          font-weight: 500;
        }
        
        .footer-link-emoji {
          text-decoration: none !important;
          display: inline-block;
        }
        
        .footer-link-text {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .footer-link:hover {
          color: rgba(110, 198, 255, 1);
        }
        
        .footer-link:hover .footer-link-text {
          text-decoration: underline;
        }
        
        .footer-link:focus-visible {
          outline: 2px solid rgba(110, 198, 255, 1);
          outline-offset: 2px;
        }
        
        .footer-link:focus-visible .footer-link-text {
          text-decoration: underline;
        }
        
        .footer-separator {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.75rem;
          margin: 0 4px;
        }
        
        .footer-icon {
          width: 11px;
          height: 11px;
          opacity: 1;
        }
        
        .footer-theme-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: var(--spacing-sm);
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
          line-height: 1.6;
          text-align: center;
          max-width: 100%;
        }
        
        .footer-note-text {
          text-align: center;
          line-height: 1.6;
        }
        
        @media (max-width: 768px) {
          .footer-content {
            padding: var(--spacing-sm);
            gap: var(--spacing-xs);
          }
          
          .footer-main {
            gap: var(--spacing-xs);
          }
          
          .footer-title {
            font-size: 0.85rem;
          }
          
          .footer-note {
            font-size: 0.7rem;
            line-height: 1.8;
            text-align: center;
          }
          
          .footer-note-text {
            text-align: center;
            line-height: 1.8;
          }
          
          .footer-bottom {
            align-items: center;
            padding-top: var(--spacing-xs);
            margin-top: var(--spacing-xs);
          }
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
          .sidebar {
            display: none;
          }
          
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .viewer-section {
            max-width: 100%;
          }
        }
        
        @media (min-width: 1920px) {
          .sidebar {
            display: flex;
          }
          
          .content-grid {
            grid-template-columns: 420px minmax(0, 1fr);
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
            padding: var(--spacing-md) var(--spacing-sm);
          }
          
          .main-content {
            padding: 0;
          }
          
          .content-grid {
            max-width: 100%;
            margin-left: 0;
            margin-right: 0;
            width: 100%;
          }
          
          .viewer-section {
            max-width: 100%;
          }
          
          h1 {
            font-size: 2rem;
            margin-bottom: var(--spacing-md);
            line-height: 1.15;
          }
          
          .hero-subtitle {
            font-size: 1rem;
            margin-bottom: var(--spacing-md);
            line-height: 1.5;
            padding: 0 8px;
          }
          
          .hero-content {
            padding: var(--spacing-lg) var(--spacing-md) !important;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 1.75rem;
            margin-bottom: var(--spacing-sm);
            line-height: 1.2;
          }
          
          .hero-subtitle {
            font-size: 0.95rem;
            margin-bottom: var(--spacing-md);
            line-height: 1.5;
            padding: 0 4px;
          }
          
          .hero-content {
            padding: var(--spacing-md) var(--spacing-sm) !important;
          }
        }
      `}</style>
    </>
  )
}

