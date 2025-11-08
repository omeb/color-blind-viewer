'use client'

import React from 'react'
import { getCategorizedFilters, getFilter, getAllFilterIds } from '../lib/filters'

// Example sites for random selection
const EXAMPLE_SITES = [
  'https://bruno-simon.com',
  'https://dogstudio.co',
  'https://rive.app',
  'https://pitch.com',
  'https://superlist.com',
  'https://news.ycombinator.com',
  'https://www.wix.com',
  'https://www.imdb.com'
]

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
export default React.forwardRef(function WebsiteViewer({ url, activeFilter = 'none', isSplitView: isSplitViewProp, onSplitViewChange, onFilterRemove, onFilterChange, onFilterInfo, onChangeUrl, loading = false, error = null, onUrlChange, history = [], onSelectUrl, onRemoveUrl, showQuickFilters = true, onFocusUrlInput }, ref) {
  const [iframeKey, setIframeKey] = React.useState(0)
  const [isSplitView, setIsSplitView] = React.useState(isSplitViewProp || false)
  const [iframeLoading, setIframeLoading] = React.useState(false)
  const [iframeLoaded, setIframeLoaded] = React.useState(false)
  const [detectedError, setDetectedError] = React.useState(null) // Internal error state for iframe JSON errors
  const [isEditingUrl, setIsEditingUrl] = React.useState(false)
  const [editedUrl, setEditedUrl] = React.useState(url)
  const [showHistoryDropdown, setShowHistoryDropdown] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const historyDropdownRef = React.useRef(null)
  const iframeRef = React.useRef(null)
  const originalIframeRef = React.useRef(null)
  const filteredIframeRef = React.useRef(null)
  const splitContainerRef = React.useRef(null)
  const containerRef = React.useRef(null)
  const urlInputRef = React.useRef(null)
  const isScrollingRef = React.useRef(false)
  const quickFiltersScrollRef = React.useRef(null)
  const [showScrollHint, setShowScrollHint] = React.useState(false)
  const [isScrolledToEnd, setIsScrolledToEnd] = React.useState(false)
  const hasUserScrolledRef = React.useRef(false) // Persist across re-renders
  const isInitialMountRef = React.useRef(true)
  const navigationHistoryRef = React.useRef([]) // Array of URLs
  const navigationIndexRef = React.useRef(-1) // Current position in history
  const isNavigatingRef = React.useRef(false) // Track if we're navigating via back/forward
  const [canGoBack, setCanGoBack] = React.useState(false)
  const [canGoForward, setCanGoForward] = React.useState(false)
  const [showRandomHint, setShowRandomHint] = React.useState(false)
  const hasSeenRandomHintRef = React.useRef(false)
  const [showHoverHint, setShowHoverHint] = React.useState(false)
  const [showSplitViewHover, setShowSplitViewHover] = React.useState(false)
  const iframeLoadingTimeoutRef = React.useRef(null)
  const isIframeLoadingRef = React.useRef(false)
  
  // Expose focus method via ref
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (!isEditingUrl) {
        setIsEditingUrl(true)
        // Wait for next tick to ensure input is rendered
        setTimeout(() => {
          urlInputRef.current?.focus()
        }, 0)
      } else {
        urlInputRef.current?.focus()
      }
    }
  }))
  
  // Detect mobile device for filter fallback
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Check localStorage on mount to see if hint was already shown
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenHint = localStorage.getItem('colorblind-random-hint-seen') === 'true'
      hasSeenRandomHintRef.current = hasSeenHint
    }
  }, [])
  
  // Initialize navigation history when URL changes from user input
  React.useEffect(() => {
    if (!url) {
      // Reset history when URL is cleared
      navigationHistoryRef.current = []
      navigationIndexRef.current = -1
      setCanGoBack(false)
      setCanGoForward(false)
      return
    }
    
    // If we're navigating via back/forward, don't add to history
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false
      setCanGoBack(navigationIndexRef.current > 0)
      setCanGoForward(navigationIndexRef.current < navigationHistoryRef.current.length - 1)
      return
    }
    
    // Initialize history with first URL if empty
    if (navigationHistoryRef.current.length === 0) {
      navigationHistoryRef.current = [url]
      navigationIndexRef.current = 0
      setCanGoBack(false)
      setCanGoForward(false)
      return
    }
    
    // If URL changed and it's not already the current URL in history
    const currentUrl = navigationHistoryRef.current[navigationIndexRef.current]
    if (currentUrl !== url) {
      // Remove any forward history if we're not at the end
      if (navigationIndexRef.current < navigationHistoryRef.current.length - 1) {
        navigationHistoryRef.current = navigationHistoryRef.current.slice(0, navigationIndexRef.current + 1)
      }
      
      // Add new URL to history
      navigationHistoryRef.current.push(url)
      navigationIndexRef.current = navigationHistoryRef.current.length - 1
    }
    
    // Update button states
    setCanGoBack(navigationIndexRef.current > 0)
    setCanGoForward(navigationIndexRef.current < navigationHistoryRef.current.length - 1)
  }, [url])
  
  // Navigation handlers
  const handleBack = () => {
    if (navigationIndexRef.current > 0) {
      navigationIndexRef.current--
      isNavigatingRef.current = true
      const previousUrl = navigationHistoryRef.current[navigationIndexRef.current]
      if (onUrlChange) {
        onUrlChange(previousUrl)
      }
    }
  }
  
  const handleForward = () => {
    if (navigationIndexRef.current < navigationHistoryRef.current.length - 1) {
      navigationIndexRef.current++
      isNavigatingRef.current = true
      const nextUrl = navigationHistoryRef.current[navigationIndexRef.current]
      if (onUrlChange) {
        onUrlChange(nextUrl)
      }
    }
  }
  
  const handleRandomSite = (e) => {
    // Prevent any focus behavior
    e?.preventDefault()
    e?.stopPropagation()
    
    // Hide hint when user clicks the button and mark as seen
    setShowRandomHint(false)
    setShowHoverHint(false)
    hasSeenRandomHintRef.current = true
    if (typeof window !== 'undefined') {
      localStorage.setItem('colorblind-random-hint-seen', 'true')
    }
    
    // Ensure URL input is not in editing mode and blur if focused
    setIsEditingUrl(false)
    if (urlInputRef.current && document.activeElement === urlInputRef.current) {
      urlInputRef.current.blur()
    }
    
    const randomIndex = Math.floor(Math.random() * EXAMPLE_SITES.length)
    const randomSite = EXAMPLE_SITES[randomIndex]
    if (onUrlChange) {
      onUrlChange(randomSite)
    }
  }
  
  // Show random button hint on first URL load (after 20 seconds, only once)
  React.useEffect(() => {
    if (!url || hasSeenRandomHintRef.current) return
    
    // Show hint after 20 seconds
    const showTimer = setTimeout(() => {
      setShowRandomHint(true)
      // Mark as seen in localStorage when shown
      if (typeof window !== 'undefined') {
        localStorage.setItem('colorblind-random-hint-seen', 'true')
      }
    }, 20000) // Show after 20 seconds
    
    // Hide hint after 6 seconds of being visible
    const hideTimer = setTimeout(() => {
      setShowRandomHint(false)
      hasSeenRandomHintRef.current = true
    }, 26000) // Hide after 26 seconds total (20s delay + 6s visible)
    
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [url])
  
  // Check if quick filters are scrollable and update hint visibility
  React.useEffect(() => {
    // Reset scroll state only on very first mount (page refresh)
    if (isInitialMountRef.current) {
      hasUserScrolledRef.current = false
      isInitialMountRef.current = false
    }
    
    const checkScrollability = () => {
      const scrollContainer = quickFiltersScrollRef.current
      if (!scrollContainer) return
      
      const isScrollable = scrollContainer.scrollWidth > scrollContainer.clientWidth
      const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10
      
      setIsScrolledToEnd(isScrollable && isAtEnd)
      
      // Only show hint if scrollable, not at end, and user has NEVER scrolled
      if (!hasUserScrolledRef.current) {
        setShowScrollHint(isScrollable && !isAtEnd)
      }
    }
    
    const handleScroll = () => {
      const scrollContainer = quickFiltersScrollRef.current
      if (!scrollContainer) return
      
      // Mark that user has scrolled (persists across URL changes)
      // Use a very small threshold to catch any scroll movement
      if (scrollContainer.scrollLeft > 1 && !hasUserScrolledRef.current) {
        hasUserScrolledRef.current = true
        setShowScrollHint(false) // Immediately hide the hint - CSS handles fade-out
      }
      
      // Update end state
      const isAtEnd = scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10
      setIsScrolledToEnd(isAtEnd)
    }
    
    checkScrollability()
    
    const scrollContainer = quickFiltersScrollRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      window.addEventListener('resize', checkScrollability)
      
      // Use ResizeObserver to detect content changes
      const resizeObserver = new ResizeObserver(checkScrollability)
      resizeObserver.observe(scrollContainer)
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', checkScrollability)
        resizeObserver.disconnect()
      }
    }
  }, [url]) // Re-check when URL changes (filters might change)
  
  // Scroll active filter into view when it changes
  React.useEffect(() => {
    if (!activeFilter || !showQuickFilters) return
    
    const scrollContainer = quickFiltersScrollRef.current
    if (!scrollContainer) return
    
    // Wait for DOM to update
    requestAnimationFrame(() => {
      const activeButton = scrollContainer.querySelector('.quick-filter-btn.active')
      if (activeButton) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const buttonRect = activeButton.getBoundingClientRect()
        
        // Check if button is out of view
        const isOutOfViewLeft = buttonRect.left < containerRect.left
        const isOutOfViewRight = buttonRect.right > containerRect.right
        
        if (isOutOfViewLeft || isOutOfViewRight) {
          // Scroll the button into view, centered if possible
          activeButton.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          })
        }
      }
    })
  }, [activeFilter, showQuickFilters, url])
  
  // Sync split view with prop
  React.useEffect(() => {
    if (isSplitViewProp !== undefined) {
      setIsSplitView(isSplitViewProp)
    }
  }, [isSplitViewProp])
  
  // Synchronize scrolling between split view iframes
  React.useEffect(() => {
    if (!isSplitView || activeFilter === 'none') return
    
    const originalIframe = originalIframeRef.current
    const filteredIframe = filteredIframeRef.current
    
    if (!originalIframe || !filteredIframe) return
    
    let rafId = null
    let lastOriginalScrollTop = 0
    let lastOriginalScrollLeft = 0
    let lastFilteredScrollTop = 0
    let lastFilteredScrollLeft = 0
    
    const syncScroll = (sourceDoc, targetDoc, isFromOriginal) => {
      if (isScrollingRef.current || !sourceDoc || !targetDoc) return
      
      try {
        const sourceScrollTop = sourceDoc.documentElement.scrollTop || sourceDoc.body.scrollTop || 0
        const sourceScrollLeft = sourceDoc.documentElement.scrollLeft || sourceDoc.body.scrollLeft || 0
        
        // Track last scroll positions separately for each iframe
        const lastScrollTop = isFromOriginal ? lastOriginalScrollTop : lastFilteredScrollTop
        const lastScrollLeft = isFromOriginal ? lastOriginalScrollLeft : lastFilteredScrollLeft
        
        // Only sync if scroll position actually changed
        if (Math.abs(sourceScrollTop - lastScrollTop) > 0.5 || Math.abs(sourceScrollLeft - lastScrollLeft) > 0.5) {
          isScrollingRef.current = true
          
          // Use requestAnimationFrame for smooth synchronization
          if (rafId) {
            cancelAnimationFrame(rafId)
          }
          
          rafId = requestAnimationFrame(() => {
            try {
              targetDoc.documentElement.scrollTop = sourceScrollTop
              targetDoc.documentElement.scrollLeft = sourceScrollLeft
              
              // Also sync body scroll if documentElement doesn't work
              if (targetDoc.body) {
                targetDoc.body.scrollTop = sourceScrollTop
                targetDoc.body.scrollLeft = sourceScrollLeft
              }
              
              // Update the appropriate last scroll position
              if (isFromOriginal) {
                lastOriginalScrollTop = sourceScrollTop
                lastOriginalScrollLeft = sourceScrollLeft
                // Also update filtered's last position since we just synced it
                lastFilteredScrollTop = sourceScrollTop
                lastFilteredScrollLeft = sourceScrollLeft
              } else {
                lastFilteredScrollTop = sourceScrollTop
                lastFilteredScrollLeft = sourceScrollLeft
                // Also update original's last position since we just synced it
                lastOriginalScrollTop = sourceScrollTop
                lastOriginalScrollLeft = sourceScrollLeft
              }
            } catch (e) {
              // Cross-origin restrictions may prevent access
            }
            
            setTimeout(() => {
              isScrollingRef.current = false
            }, 10)
          })
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
    }
    
    const handleOriginalScroll = () => {
      try {
        const originalDoc = originalIframe.contentDocument || originalIframe.contentWindow?.document
        const filteredDoc = filteredIframe.contentDocument || filteredIframe.contentWindow?.document
        if (originalDoc && filteredDoc) {
          syncScroll(originalDoc, filteredDoc, true)
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
    }
    
    const handleFilteredScroll = () => {
      try {
        const originalDoc = originalIframe.contentDocument || originalIframe.contentWindow?.document
        const filteredDoc = filteredIframe.contentDocument || filteredIframe.contentWindow?.document
        if (originalDoc && filteredDoc) {
          syncScroll(filteredDoc, originalDoc, false)
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
    }
    
    // Wait for iframes to load before attaching listeners
    const attachListeners = () => {
      try {
        const originalWindow = originalIframe.contentWindow
        const filteredWindow = filteredIframe.contentWindow
        const originalDoc = originalIframe.contentDocument || originalWindow?.document
        const filteredDoc = filteredIframe.contentDocument || filteredWindow?.document
        
        if (!originalDoc || !filteredDoc) {
          return false
        }
        
        // Attach scroll listeners to both window and document
        if (originalWindow) {
          originalWindow.addEventListener('scroll', handleOriginalScroll, { passive: true })
          if (originalDoc.documentElement) {
            originalDoc.documentElement.addEventListener('scroll', handleOriginalScroll, { passive: true })
          }
        }
        
        if (filteredWindow) {
          filteredWindow.addEventListener('scroll', handleFilteredScroll, { passive: true })
          if (filteredDoc.documentElement) {
            filteredDoc.documentElement.addEventListener('scroll', handleFilteredScroll, { passive: true })
          }
        }
        
        return true
      } catch (e) {
        // Cross-origin restrictions may prevent access
        return false
      }
    }
    
    // Try to attach listeners with retries
    let retryCount = 0
    const maxRetries = 10
    
    const tryAttach = () => {
      if (attachListeners() || retryCount >= maxRetries) {
        return
      }
      retryCount++
      setTimeout(tryAttach, 200)
    }
    
    // Start trying immediately
    tryAttach()
    
    // Also try after iframe loads
    const timeout = setTimeout(() => {
      retryCount = 0
      tryAttach()
    }, 1000)
    
    return () => {
      clearTimeout(timeout)
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      
      try {
        const originalWindow = originalIframe.contentWindow
        const filteredWindow = filteredIframe.contentWindow
        const originalDoc = originalIframe.contentDocument || originalWindow?.document
        const filteredDoc = filteredIframe.contentDocument || filteredWindow?.document
        
        if (originalWindow && originalDoc) {
          originalWindow.removeEventListener('scroll', handleOriginalScroll)
          if (originalDoc.documentElement) {
            originalDoc.documentElement.removeEventListener('scroll', handleOriginalScroll)
          }
        }
        
        if (filteredWindow && filteredDoc) {
          filteredWindow.removeEventListener('scroll', handleFilteredScroll)
          if (filteredDoc.documentElement) {
            filteredDoc.documentElement.removeEventListener('scroll', handleFilteredScroll)
          }
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
    }
  }, [isSplitView, activeFilter, iframeLoaded])
  
  // Handle split view toggle
  const handleSplitViewToggle = () => {
    const newValue = !isSplitView
    setIsSplitView(newValue)
    if (onSplitViewChange) {
      onSplitViewChange(newValue)
    }
  }
  
  // Build proxy URL - only if there's no error
  // Use refs to check error state to prevent race conditions
  const proxyUrl = React.useMemo(() => {
    const hasError = error || detectedError
    return (url && !hasError) ? `/api/proxy?url=${encodeURIComponent(url)}` : null
  }, [url, error, detectedError])
  
  // Update edited URL when url prop changes
  React.useEffect(() => {
    setEditedUrl(url)
  }, [url])
  
  // Focus input when editing mode is activated
  React.useEffect(() => {
    if (isEditingUrl && urlInputRef.current) {
      urlInputRef.current.focus()
      urlInputRef.current.select()
      // Show history dropdown when input is focused
      if (history && history.length > 0) {
        setShowHistoryDropdown(true)
      }
    } else {
      setShowHistoryDropdown(false)
    }
  }, [isEditingUrl, history])
  
  // Close history dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target)) {
        // Don't close if clicking on the URL input
        if (!event.target.closest('.url-edit-input') && !event.target.closest('.url-edit-form')) {
          setShowHistoryDropdown(false)
        }
      }
    }
    
    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHistoryDropdown])
  
  // Reload iframe when URL changes - but only if there's no error
  // Use a ref to track error state to prevent dependency-triggered reloads
  const errorRef = React.useRef({ error: null, detectedError: null })
  const lastProcessedUrlRef = React.useRef(null)
  const isInErrorStateRef = React.useRef(false)
  
  React.useEffect(() => {
    const hasError = error || detectedError
    errorRef.current = { error, detectedError }
    isInErrorStateRef.current = hasError
  }, [error, detectedError])
  
  React.useEffect(() => {
    // Don't process if we're in an error state
    if (isInErrorStateRef.current) {
      return
    }
    
    // Only process if URL actually changed
    if (url === lastProcessedUrlRef.current) {
      return
    }
    
    lastProcessedUrlRef.current = url
    
    // Clear any existing timeout
    if (iframeLoadingTimeoutRef.current) {
      clearTimeout(iframeLoadingTimeoutRef.current)
      iframeLoadingTimeoutRef.current = null
    }
    
    // Check current error state from ref to avoid dependency-triggered reloads
    const hasError = errorRef.current.error || errorRef.current.detectedError
    
    if (url && !hasError) {
      setIframeKey(prev => prev + 1)
      isIframeLoadingRef.current = true
      setIframeLoading(true)
      setIframeLoaded(false)
      
      // Set up timeout to retry if iframe loading takes too long
      iframeLoadingTimeoutRef.current = setTimeout(() => {
        // Check if still loading using ref
        if (isIframeLoadingRef.current && onUrlChange) {
          console.warn('Iframe loading timeout - retrying navigation')
          // Retry navigation
          iframeLoadingTimeoutRef.current = null
          onUrlChange(url)
        }
      }, 4000) // 4 seconds
    } else if (!url) {
      // Reset loading states when URL is cleared
      isIframeLoadingRef.current = false
      setIframeLoading(false)
      setIframeLoaded(false)
      lastProcessedUrlRef.current = null
    }
    
    // Cleanup timeout on unmount or URL change
    return () => {
      if (iframeLoadingTimeoutRef.current) {
        clearTimeout(iframeLoadingTimeoutRef.current)
        iframeLoadingTimeoutRef.current = null
      }
    }
  }, [url, onUrlChange]) // Only depend on url, not error states
  
  // Handle iframe load event
  const handleIframeLoad = (e) => {
    // Clear timeout since iframe loaded
    if (iframeLoadingTimeoutRef.current) {
      clearTimeout(iframeLoadingTimeoutRef.current)
      iframeLoadingTimeoutRef.current = null
    }
    
    // Don't process if there's already an error - check ref for latest state
    if (isInErrorStateRef.current || error || detectedError) {
      return
    }
    
    // Small delay to ensure content is rendered
    setTimeout(() => {
      // Don't process if error was set during the delay - check ref again
      if (isInErrorStateRef.current || error || detectedError) {
        return
      }
      
      // Try to detect if the iframe content is a JSON error
      try {
        const iframe = e?.target || iframeRef.current || originalIframeRef.current || filteredIframeRef.current
        if (iframe && iframe.contentWindow) {
          try {
            // Try to access iframe content (same-origin proxy should be accessible)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
            const bodyText = iframeDoc?.body?.textContent?.trim() || ''
            
            // Check if content looks like JSON error
            if (bodyText.startsWith('{') && bodyText.includes('"error"')) {
              try {
                const errorData = JSON.parse(bodyText)
                if (errorData.error) {
                  // Set internal error state to show friendly error UI
                  setDetectedError(errorData.error)
                  isInErrorStateRef.current = true
                  setIframeLoading(false)
                  setIframeLoaded(false)
                  return
                }
              } catch (parseError) {
                // Not valid JSON, continue normally
              }
            }
          } catch (crossOriginError) {
            // Can't access iframe content - this is normal for external sites
            // Continue with normal load
          }
        }
      } catch (error) {
        // Error checking iframe content - continue normally
        console.debug('Could not check iframe content:', error)
      }
      
      // Only clear detected error and mark as loaded if there's no error prop
      // Don't clear if we're in an error state
      if (!isInErrorStateRef.current && !error && !detectedError) {
        isIframeLoadingRef.current = false
        setDetectedError(null)
        setIframeLoading(false)
        setIframeLoaded(true)
      } else {
        // If there's an error, keep loading states false
        isIframeLoadingRef.current = false
        setIframeLoading(false)
        setIframeLoaded(false)
      }
    }, 300)
  }
  
  // Reset detected error when URL actually changes (not just reference)
  const lastUrlRef = React.useRef(url)
  React.useEffect(() => {
    // Only reset detectedError if URL actually changed, not just reference
    if (url !== lastUrlRef.current) {
      lastUrlRef.current = url
      setDetectedError(null)
      isInErrorStateRef.current = false
    }
  }, [url])
  
  // Clear loading states when error occurs and prevent reloads
  React.useEffect(() => {
    if (error || detectedError) {
      isIframeLoadingRef.current = false
      isInErrorStateRef.current = true
      setIframeLoading(false)
      setIframeLoaded(false)
      // Don't reset lastProcessedUrlRef - we want to prevent reloads for this URL
      // Only reset it when URL actually changes (handled in the URL effect above)
    }
  }, [error, detectedError])
  
  // Handle refresh
  const handleRefresh = () => {
    setIframeKey(prev => prev + 1)
    setIframeLoading(true)
    setIframeLoaded(false)
  }
  
  // Handle URL edit activation
  const handleUrlClick = () => {
    setIsEditingUrl(true)
  }
  
  // Handle URL change
  const handleUrlInputChange = (e) => {
    const newValue = e.target.value
    setEditedUrl(newValue)
    // Close dropdown when user starts typing manually
    if (newValue.trim() && showHistoryDropdown) {
      setShowHistoryDropdown(false)
    }
  }
  
  // Format URL (same logic as UrlInput component)
  const formatUrl = (inputUrl) => {
    let formatted = inputUrl.trim()
    
    // Remove spaces
    formatted = formatted.replace(/\s+/g, '')
    
    // Fix common typos: replace -com, -org, -net with .com, .org, .net
    formatted = formatted.replace(/-(com|org|net|io|co|edu|gov)$/i, '.$1')
    
    // Extract protocol if present
    let protocol = ''
    let rest = formatted
    
    if (formatted.startsWith('http://')) {
      protocol = 'http://'
      rest = formatted.slice(7)
    } else if (formatted.startsWith('https://')) {
      protocol = 'https://'
      rest = formatted.slice(8)
    }
    
    // Extract domain and path/query
    const pathMatch = rest.match(/^([^/?#]+)(.*)$/)
    let domain = pathMatch ? pathMatch[1] : rest
    const path = pathMatch ? pathMatch[2] : ''
    
    // If domain has no dot character, append .com
    if (domain && !domain.includes('.')) {
      domain = domain + '.com'
    }
    
    // Check if domain has a subdomain
    const domainParts = domain.split('.')
    
    // Common two-part TLDs (country code + top-level domain)
    const twoPartTlds = ['co.il', 'co.uk', 'com.au', 'com.br', 'com.mx', 'com.ar', 'co.za', 'co.nz', 'co.jp', 'com.sg', 'com.hk', 'com.tw', 'com.tr', 'com.pl', 'com.ro', 'com.gr', 'com.es', 'com.it', 'com.fr', 'com.de', 'com.nl', 'com.be', 'com.se', 'com.no', 'com.dk', 'com.fi', 'com.pt', 'com.cz', 'com.hu', 'com.ua', 'com.ru', 'com.cn', 'com.in', 'com.my', 'com.ph', 'com.vn', 'com.th', 'com.id', 'com.kr', 'com.jp', 'net.au', 'org.uk', 'gov.uk', 'ac.uk', 'edu.au', 'gov.au', 'net.au', 'org.au']
    
    // Check if the last 2 parts form a two-part TLD
    const lastTwoParts = domainParts.length >= 2 
      ? domainParts.slice(-2).join('.') 
      : ''
    const isTwoPartTld = twoPartTlds.includes(lastTwoParts.toLowerCase())
    
    // Determine if we need to add www.
    // If domain has only 2 parts (domain.tld) OR 
    // if domain has 3 parts and last 2 form a two-part TLD (domain.co.il)
    let finalDomain = domain
    if (domainParts.length === 2) {
      // Simple case: domain.tld -> www.domain.tld
      finalDomain = 'www.' + domain
    } else if (domainParts.length === 3 && isTwoPartTld) {
      // Two-part TLD case: domain.co.il -> www.domain.co.il
      finalDomain = 'www.' + domain
    }
    // If domainParts.length > 3 or already has subdomain, leave as is
    
    // Reconstruct URL with protocol
    if (!protocol) {
      protocol = 'https://'
    }
    
    formatted = protocol + finalDomain + path
    
    return formatted
  }
  
  // Handle URL submit
  const handleUrlSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent any event bubbling
    
    // Always close dropdown on submit
    setShowHistoryDropdown(false)
    
    if (editedUrl.trim() && onUrlChange) {
      const formattedUrl = formatUrl(editedUrl)
      
      // Update the input field to show the formatted URL
      setEditedUrl(formattedUrl)
      
      // Use the formatted URL from input, not from dropdown
      onUrlChange(formattedUrl)
      setIsEditingUrl(false)
    }
  }
  
  // Handle URL cancel
  const handleUrlCancel = () => {
    setEditedUrl(url)
    setIsEditingUrl(false)
  }
  
  // Handle keydown for escape key and enter
  const handleUrlKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleUrlCancel()
      setShowHistoryDropdown(false)
    } else if (e.key === 'Enter') {
      // Close dropdown when Enter is pressed
      setShowHistoryDropdown(false)
      // Form submission will handle the rest
    } else if (e.key.length === 1) {
      // User is typing - close dropdown
      if (showHistoryDropdown) {
        setShowHistoryDropdown(false)
      }
    }
  }
  
  
  // Format URL for display
  const getDisplayUrl = (url) => {
    try {
      // Special case for Hacker News
      if (url.includes('news.ycombinator.com')) {
        return 'Hacker News'
      }
      // Remove protocol
      let domain = url.replace(/^https?:\/\//, '')
      // Remove www. prefix
      domain = domain.replace(/^www\./, '')
      // Remove path, query, hash
      domain = domain.split('/')[0].split('?')[0].split('#')[0]
      return domain
    } catch (e) {
      return url
    }
  }
  
  return (
    <div className="website-viewer-wrapper">
      {url && (
        <div className="viewer-header">
          {isEditingUrl ? (
            <form onSubmit={handleUrlSubmit} className={`url-edit-form ${isEditingUrl ? 'editing' : ''}`}>
              <div className="url-input-wrapper" ref={historyDropdownRef}>
                <input
                  ref={urlInputRef}
                  type="text"
                  value={editedUrl}
                  onChange={handleUrlInputChange}
                  onKeyDown={handleUrlKeyDown}
                  onFocus={() => {
                    if (history && history.length > 0) {
                      setShowHistoryDropdown(true)
                    }
                  }}
                  className="url-edit-input"
                  placeholder="Enter website URL"
                  aria-label="Edit website URL"
                />
                {showHistoryDropdown && history && history.length > 0 && (
                  <div className="history-dropdown">
                    <div className="history-dropdown-header">
                      <span>Recent Sites</span>
                    </div>
                    <div className="history-dropdown-list">
                      {history.slice(0, 5).map((historyUrl, index) => (
                        <div key={`${historyUrl}-${index}`} className="history-dropdown-item-wrapper">
                          <button
                            onClick={() => {
                              // Update input value immediately
                              setEditedUrl(historyUrl)
                              setShowHistoryDropdown(false)
                              setIsEditingUrl(false)
                              // Then trigger the callback
                              if (onSelectUrl) {
                                onSelectUrl(historyUrl)
                              }
                            }}
                            className="history-dropdown-item"
                            title={`Load ${historyUrl}`}
                          >
                            <span className="history-item-icon">🌐</span>
                            <span className="history-item-url">{getDisplayUrl(historyUrl)}</span>
                          </button>
                          {onRemoveUrl && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveUrl(historyUrl)
                              }}
                              className="history-item-remove"
                              aria-label={`Remove ${historyUrl}`}
                              title="Remove"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="url-edit-actions">
                <button
                  type="submit"
                  className="url-action-btn url-action-submit"
                  aria-label="Apply URL change"
                  title="Apply (Enter)"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={handleUrlCancel}
                  className="url-action-btn url-action-cancel"
                  aria-label="Cancel URL change"
                  title="Cancel (Escape)"
                >
                  ✕
                </button>
              </div>
            </form>
          ) : (
            <div 
              className="url-display clickable" 
              onClick={handleUrlClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleUrlClick()
                }
              }}
              aria-label="Click to edit URL"
              title="Click to edit URL"
            >
              <span className="url-icon">🌐</span>
              <span className="url-text">{url}</span>
              <span className="url-edit-hint">✎</span>
            </div>
          )}
          
          <div className="viewer-controls">
            {activeFilter !== 'none' && (
              <button
                onClick={handleSplitViewToggle}
                onMouseEnter={() => setShowSplitViewHover(true)}
                onMouseLeave={() => setShowSplitViewHover(false)}
                className={`control-btn ${isSplitView ? 'active' : ''}`}
                aria-label={isSplitView ? 'Exit split view' : 'Compare side-by-side'}
                title={isSplitView ? 'Exit Split View' : 'Compare Side-by-Side'}
              >
                <span className="btn-icon">
                  {isSplitView ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none"/>
                      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="8" height="18" rx="1" stroke="currentColor" fill="none"/>
                      <rect x="13" y="3" width="8" height="18" rx="1" stroke="currentColor" fill="none"/>
                    </svg>
                  )}
                </span>
                {showSplitViewHover && (
                  <span className="split-view-popover">{isSplitView ? 'Exit Split View' : 'Split View'}</span>
                )}
              </button>
            )}
            
            <button
              onClick={handleBack}
              className="control-btn"
              aria-label="Go back"
              title="Go back"
              disabled={!canGoBack || loading || iframeLoading}
            >
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="M12 19l-7-7 7-7"></path>
                </svg>
              </span>
            </button>
            
            <button
              onClick={handleForward}
              className="control-btn"
              aria-label="Go forward"
              title="Go forward"
              disabled={!canGoForward || loading || iframeLoading}
            >
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </span>
            </button>
            
            <button
              onClick={handleRefresh}
              className="control-btn refresh-btn"
              aria-label="Refresh page"
              title="Refresh"
              disabled={loading || iframeLoading}
            >
              <span className="btn-icon">↻</span>
            </button>
            
            <button
              onClick={handleRandomSite}
              onMouseEnter={() => setShowHoverHint(true)}
              onMouseLeave={() => setShowHoverHint(false)}
              className={`control-btn random-btn ${showRandomHint || showHoverHint ? 'pulse-hint' : ''}`}
              aria-label="Load random example site"
              title="Load random example site"
              disabled={loading || iframeLoading}
            >
              <span className="btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                  <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                  <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </span>
              {showHoverHint && (
                <span className="random-popover">Random Site</span>
              )}
              {(showRandomHint && !showHoverHint) && (
                <span className={`random-hint-text ${showHoverHint ? 'hover-hint' : ''}`}>✨ Try a random site!</span>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Quick Filter Buttons - Above the viewer */}
      {url && showQuickFilters && (
        <div className="quick-filters" ref={quickFiltersScrollRef}>
          <div className="quick-filters-scroll">
            <button
              onClick={() => {
                onFilterChange && onFilterChange('none')
              }}
              className={`quick-filter-btn ${activeFilter === 'none' ? 'active' : ''}`}
              title="Click to apply filter"
            >
              None
            </button>
            {getCategorizedFilters().colorblind.map((filter) => (
              <div key={filter.id} style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  onClick={() => {
                    onFilterChange && onFilterChange(filter.id)
                  }}
                  className={`quick-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                  title="Click to apply filter"
                >
                  {filter.name}
                </button>
                {onFilterInfo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      const rect = e.currentTarget.getBoundingClientRect()
                      onFilterInfo(filter.id, {
                        x: rect.right + 12,
                        y: rect.top + rect.height / 2
                      })
                    }}
                    className="filter-info-icon-btn"
                    aria-label={`Learn more about ${filter.name}`}
                    title="Learn more"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M7 5V7M7 9H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {getCategorizedFilters().other.map((filter) => (
              <div key={filter.id} style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  onClick={() => {
                    onFilterChange && onFilterChange(filter.id)
                  }}
                  className={`quick-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                  title="Click to apply filter"
                >
                  {filter.name}
                </button>
                {onFilterInfo && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      const rect = e.currentTarget.getBoundingClientRect()
                      onFilterInfo(filter.id, {
                        x: rect.right + 12,
                        y: rect.top + rect.height / 2
                      })
                    }}
                    className="filter-info-icon-btn"
                    aria-label={`Learn more about ${filter.name}`}
                    title="Learn more"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M7 5V7M7 9H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Scroll hint - fade gradient */}
          <div className="scroll-hint" data-hidden={!showScrollHint}>
            <div className="scroll-hint-gradient"></div>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        className={`website-viewer-container ${isSplitView ? 'split-view' : ''}`}
      >
      
      {!url && !loading && !error && (
        <div className="empty-state">
          <p>Enter a website URL above to get started</p>
          <p className="hint">Try: wix.com, github.com, or any website you want to test</p>
        </div>
      )}
      
      {/* Show loading state immediately when url exists OR loading is true - but not if there's an error */}
      {(loading || iframeLoading || (url && !iframeLoaded)) && !error && !detectedError && (
        <div className={`loading-state ${iframeLoading ? 'iframe-loading' : 'initial-loading'}`} role="status" aria-live="polite">
          <div className="loading-content">
            {!iframeLoading ? (
              <>
                <div className="loading-orb">
                  <div className="orb-inner"></div>
                  <div className="orb-pulse"></div>
                  <div className="orb-glow"></div>
                </div>
                <div className="loading-text-wrapper">
                  <h3 className="loading-title">Preparing your view</h3>
                  <p className="loading-subtitle">Setting up the accessibility viewer</p>
                </div>
                <div className="loading-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </>
            ) : (
              <>
                <div className="loading-text-wrapper">
                  <p className="loading-text">Loading website</p>
                  <div className="loading-progress">
                    <div className="progress-bar"></div>
                  </div>
                </div>
                <div className="loading-skeleton">
                  <div className="skeleton-header">
                    <div className="skeleton-line skeleton-line-short"></div>
                    <div className="skeleton-circle"></div>
                  </div>
                  <div className="skeleton-body">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line skeleton-line-medium"></div>
                    <div className="skeleton-box"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line skeleton-line-short"></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {(error || detectedError) && (() => {
        // Use detected error from iframe if available, otherwise use prop error
        const displayError = detectedError || error
        // Parse error message to determine error type
        const errorLower = displayError.toLowerCase()
        let errorType = 'generic'
        let userFriendlyTitle = 'Unable to Load Website'
        let userFriendlyMessage = 'We couldn\'t load this website. This might be due to security restrictions or network issues'
        let suggestions = [
          'Try a different website URL',
          'Check if the website is accessible in your browser',
          'Some sites block embedding for security reasons'
        ]
        
        if (errorLower.includes('403') || errorLower.includes('forbidden')) {
          errorType = 'forbidden'
          userFriendlyTitle = 'Preview Not Available'
          userFriendlyMessage = 'This website doesn\'t allow embedding, so we can\'t show a preview here. You can still open it directly in your browser to view it'
          suggestions = [
            'Click the URL above to open it in a new tab',
            'Try a different website that allows previews',
            'Many sites restrict embedding for security'
          ]
        } else if (errorLower.includes('401') || errorLower.includes('unauthorized')) {
          errorType = 'unauthorized'
          userFriendlyTitle = 'Login Required'
          userFriendlyMessage = 'This page requires you to sign in. You\'ll need to open it in your browser and log in first'
          suggestions = [
            'Open the URL above in your browser to sign in',
            'Try accessing a public page instead',
            'Some sites require authentication before viewing'
          ]
        } else if (errorLower.includes('500') || errorLower.includes('server error') || errorLower.includes('internal server')) {
          errorType = 'servererror'
          userFriendlyTitle = 'Temporary Issue'
          userFriendlyMessage = 'The website\'s server is having a temporary problem. This usually resolves quickly'
          suggestions = [
            'Try again in a moment',
            'The site might be temporarily unavailable',
            'Check back in a few minutes'
          ]
        } else if (errorLower.includes('404') || errorLower.includes('not found')) {
          errorType = 'notfound'
          userFriendlyTitle = 'Page Not Found'
          userFriendlyMessage = 'We couldn\'t find this page. It might have been moved or the URL might have a typo'
          suggestions = [
            'Check the URL above for any typos',
            'Try removing or adding www.',
            'The page might have been moved or deleted'
          ]
        } else if (errorLower.includes('timeout') || errorLower.includes('too long')) {
          errorType = 'timeout'
          userFriendlyTitle = 'Taking Too Long'
          userFriendlyMessage = 'The website is taking longer than usual to load. This might be temporary'
          suggestions = [
            'Try again in a moment',
            'Check your internet connection',
            'The site might be experiencing high traffic'
          ]
        } else if (errorLower.includes('network') || errorLower.includes('connection')) {
          errorType = 'network'
          userFriendlyTitle = 'Connection Issue'
          userFriendlyMessage = 'We couldn\'t connect to the website. This might be a temporary network issue'
          suggestions = [
            'Check your internet connection',
            'Try refreshing the page',
            'Verify the URL is correct'
          ]
        } else if (errorLower.includes('html page') || errorLower.includes('not html')) {
          errorType = 'nothtml'
          userFriendlyTitle = 'Not a Web Page'
          userFriendlyMessage = 'This URL points to a file or API, not a web page. Try using a website URL instead'
          suggestions = [
            'Make sure you\'re using a website URL',
            'Try the main page of the website',
            'Some URLs point to files or APIs, not web pages'
          ]
        }
        
        // Minimalist, modern error icons - simple and clean
        const ErrorIcon = () => {
          const iconSize = 80
          const strokeWidth = 3
          
          switch (errorType) {
            case 'forbidden':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(110, 198, 255, 0.08)" className="error-icon-bg"/>
                  <circle cx="60" cy="60" r="40" stroke="rgba(110, 198, 255, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M45 45L75 75M75 45L45 75" stroke="rgba(110, 198, 255, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                </svg>
              )
            case 'unauthorized':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(251, 191, 36, 0.08)" className="error-icon-bg"/>
                  <circle cx="60" cy="60" r="40" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M60 40V60M60 70V80" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                  <circle cx="60" cy="50" r="3" fill="rgba(251, 191, 36, 0.9)" className="error-icon-main"/>
                </svg>
              )
            case 'servererror':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(251, 191, 36, 0.08)" className="error-icon-bg"/>
                  <rect x="35" y="50" width="50" height="40" rx="4" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M45 60H75M45 70H75M45 80H65" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                  <path d="M60 30L55 40L65 40Z" fill="rgba(251, 191, 36, 0.9)" className="error-icon-main"/>
                </svg>
              )
            case 'notfound':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(156, 163, 175, 0.08)" className="error-icon-bg"/>
                  <circle cx="45" cy="45" r="25" stroke="rgba(156, 163, 175, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M65 65L85 85" stroke="rgba(156, 163, 175, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                  <path d="M35 35L50 50M50 35L35 50" stroke="rgba(156, 163, 175, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                </svg>
              )
            case 'timeout':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(251, 191, 36, 0.08)" className="error-icon-bg"/>
                  <circle cx="60" cy="60" r="40" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M60 30L60 60L75 75" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                  <circle cx="60" cy="60" r="4" fill="rgba(251, 191, 36, 0.9)" className="error-icon-main"/>
                </svg>
              )
            case 'network':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(59, 130, 246, 0.08)" className="error-icon-bg"/>
                  <circle cx="30" cy="55" r="15" stroke="rgba(59, 130, 246, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <circle cx="60" cy="30" r="15" stroke="rgba(59, 130, 246, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <circle cx="90" cy="55" r="15" stroke="rgba(59, 130, 246, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M45 55L75 55M45 45L60 20M75 45L60 20" stroke="rgba(59, 130, 246, 0.4)" strokeWidth={strokeWidth} strokeDasharray="4 4" strokeLinecap="round" className="error-icon-main"/>
                </svg>
              )
            case 'nothtml':
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(156, 163, 175, 0.08)" className="error-icon-bg"/>
                  <rect x="35" y="40" width="50" height="60" rx="3" stroke="rgba(156, 163, 175, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <path d="M35 40L50 40L50 55" stroke="rgba(156, 163, 175, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="error-icon-main"/>
                  <path d="M45 65H85M45 75H80M45 85H75" stroke="rgba(156, 163, 175, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                </svg>
              )
            default:
              return (
                <svg width={iconSize} height={iconSize} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="60" cy="60" r="50" fill="rgba(251, 191, 36, 0.08)" className="error-icon-bg"/>
                  <circle cx="60" cy="60" r="40" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} className="error-icon-main"/>
                  <circle cx="60" cy="50" r="4" fill="rgba(251, 191, 36, 0.9)" className="error-icon-main"/>
                  <path d="M60 60V85" stroke="rgba(251, 191, 36, 0.9)" strokeWidth={strokeWidth} strokeLinecap="round" className="error-icon-main"/>
                </svg>
              )
          }
        }
        
        return (
          <div className="error-state" role="alert">
            <div className="error-icon">
              <ErrorIcon />
            </div>
            <h3 className="error-title">{userFriendlyTitle}</h3>
            <p className="error-message">{userFriendlyMessage}</p>
            {onFocusUrlInput && (
              <button 
                className="error-cta-button"
                onClick={() => onFocusUrlInput()}
                type="button"
              >
                Try a Different Website
              </button>
            )}
          </div>
        )
      })()}
      
      {proxyUrl && !loading && !error && !detectedError && (
        <div className={`iframe-content ${iframeLoading ? 'loading' : ''}`}>
          {isSplitView && activeFilter !== 'none' ? (
            <div className="split-view-wrapper">
              <div className="split-labels-mobile">
                <div className="split-label-mobile">Original</div>
                <div className="split-label-mobile">With Filter</div>
              </div>
              <div className="split-container" ref={splitContainerRef}>
                {!iframeLoading && (
                  <>
                    <div className="split-label split-label-desktop split-label-left">Original</div>
                    <div className="split-label split-label-desktop split-label-right">With Filter</div>
                  </>
                )}
                <div className="split-pane split-pane-left">
                  <iframe
                    ref={originalIframeRef}
                    key={`${iframeKey}-original`}
                    src={proxyUrl}
                    title="Original website view"
                    className="website-iframe"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    loading="lazy"
                    onLoad={handleIframeLoad}
                  />
                </div>
                
                <div className="split-divider"></div>
                
                <div className="split-pane split-pane-right">
                  <div 
                    className="iframe-wrapper filtered"
                    style={{ filter: getFilterStyle(activeFilter, isMobile) }}
                  >
                    <iframe
                      ref={filteredIframeRef}
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
            </div>
          ) : (
            <div 
              className={`iframe-wrapper ${activeFilter !== 'none' ? 'filtered' : ''}`}
              style={{ filter: getFilterStyle(activeFilter, isMobile) }}
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
        </div>
      )}
      </div>
      
      <style jsx>{`
        .website-viewer-wrapper {
          position: relative;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        
        .website-viewer-container {
          width: 100%;
          max-width: 100%;
          flex: 1;
          min-height: 600px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
          /* Prevent layout shifts */
          contain: layout style;
          min-width: 0;
        }
        
        @media (max-width: 768px) {
          .website-viewer-container {
            border-radius: 0;
          }
        }
        
        .website-viewer-container.split-view {
        }
        
        
        
        
        
        
        .viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-xs);
          flex-wrap: wrap;
          position: relative;
          z-index: 10;
          min-width: 0;
          max-width: 100%;
        }
        
        @media (max-width: 768px) {
          .viewer-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--spacing-sm);
          }
          
          .url-display,
          .url-edit-form {
            width: 100%;
            flex: none;
            min-width: 0;
          }
          
          .viewer-controls {
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 0;
            padding: 8px;
            background: rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          
          .control-btn {
            padding: 0 16px;
            min-width: 48px;
            height: 48px;
            min-height: 48px;
            border-radius: 10px;
            font-size: 0.85rem;
            flex: 0 0 auto;
          }
          
          .control-btn .btn-icon {
            font-size: 1rem;
          }
          
          .control-btn .btn-text {
            display: none;
          }
          
          :global([data-theme="dark"]) .viewer-controls {
            background: rgba(255, 255, 255, 0.03);
            border-color: rgba(255, 255, 255, 0.08);
          }
        }
        
        
        .url-display {
          flex: 1;
          min-width: 200px;
          max-width: 100%;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-width: 0;
          overflow: hidden;
        }
        
        .url-display.clickable {
          cursor: pointer;
        }
        
        .url-display.clickable:hover {
          background: rgba(255, 255, 255, 1);
          border-color: rgba(74, 144, 226, 0.3);
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
          transform: translateY(-1px);
        }
        
        .url-display.clickable:active {
          transform: translateY(0);
        }
        
        .url-edit-form {
          flex: 1;
          min-width: 200px;
          max-width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        
        .url-input-wrapper {
          flex: 1;
          position: relative;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(74, 144, 226, 0.25);
          border-radius: 8px;
          padding: 12px 14px;
          min-height: 48px;
          height: 48px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        
        .url-input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(74, 144, 226, 0.6);
          box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
        }
        
        .url-edit-input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: none;
          outline: none;
          padding: 0;
          margin: 0;
        }
        
        .history-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 1500;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: popoverFadeIn 0.2s ease-out;
          overflow: hidden;
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
        
        .history-dropdown-header {
          padding: var(--spacing-sm) var(--spacing-md);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .history-dropdown-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .history-dropdown-item-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .history-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          padding-right: 40px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: background var(--transition-fast);
          text-align: left;
          font-size: 0.9rem;
        }
        
        .history-dropdown-item-wrapper:hover .history-dropdown-item {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .history-item-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        
        .history-item-url {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .history-item-remove {
          position: absolute;
          right: var(--spacing-xs);
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          font-size: 0.9rem;
          opacity: 0;
          z-index: 10;
        }
        
        .history-dropdown-item-wrapper:hover .history-item-remove {
          opacity: 1;
        }
        
        .history-item-remove:hover {
          background: rgba(255, 0, 0, 0.2);
          color: rgba(255, 255, 255, 0.9);
        }
        
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: scale(0.95);
            border-color: rgba(0, 0, 0, 0.1);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          to {
            opacity: 1;
            transform: scale(1);
            border-color: rgba(74, 144, 226, 0.6);
            box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
          }
        }
        
        .url-edit-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.95);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          letter-spacing: -0.01em;
          line-height: 1.5;
          outline: none;
          padding: 0;
          padding-left: 0;
          transition: padding-left 0.2s ease, color 0.2s ease;
        }
        
        .url-edit-input:focus {
          padding-left: 12px;
          color: rgba(0, 0, 0, 0.9);
        }
        
        .url-edit-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
          font-weight: 400;
          letter-spacing: 0;
        }
        
        .url-edit-input:focus::placeholder {
          color: rgba(0, 0, 0, 0.5);
        }
        
        .url-edit-actions {
          display: flex;
          gap: 6px;
        }
        
        .url-action-btn {
          border: none;
          border-radius: 8px;
          padding: 0;
          width: 48px;
          height: 48px;
          min-width: 48px;
          min-height: 48px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 1;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .url-action-submit {
          background: rgba(74, 144, 226, 0.9);
          color: white;
        }
        
        .url-action-submit:hover {
          background: rgba(74, 144, 226, 1);
          transform: scale(1.05);
        }
        
        .url-action-cancel {
          background: rgba(220, 38, 38, 0.9);
          color: white;
        }
        
        .url-action-cancel:hover {
          background: rgba(220, 38, 38, 1);
          transform: scale(1.05);
        }
        
        .url-action-btn:active {
          transform: scale(0.95);
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
        
        .url-edit-hint {
          flex-shrink: 0;
          font-size: 1rem;
          color: rgba(0, 0, 0, 0.4);
          transition: all 0.2s ease;
          opacity: 0;
        }
        
        .url-display.clickable:hover .url-edit-hint {
          opacity: 1;
          color: rgba(74, 144, 226, 0.8);
        }
        
        .viewer-controls {
          display: flex;
          gap: var(--spacing-xs);
          flex-wrap: wrap;
        }
        
        .quick-filters {
          margin-top: 0;
          margin-bottom: var(--spacing-md);
          padding-top: 0;
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: visible;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
          min-width: 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          position: relative;
        }
        
        .quick-filters::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        .quick-filters-scroll {
          display: flex;
          gap: 12px;
          padding-bottom: 4px;
          padding-top: 4px;
          padding-right: 100px;
          min-width: 0;
          flex: 1;
        }
        
        .scroll-hint {
          position: absolute;
          right: 32px;
          top: 50%;
          transform: translateY(-50%);
          width: auto;
          height: auto;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          z-index: 10;
          opacity: 1;
          visibility: visible;
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), 
                      visibility 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .scroll-hint[data-hidden="true"] {
          opacity: 0;
          visibility: hidden;
          transform: translateY(-50%) translateX(10px);
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                      visibility 0.6s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .scroll-hint-gradient {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 50px;
          background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.4) 100%);
          pointer-events: none;
          opacity: 1;
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
        }
        
        .scroll-hint[data-hidden="true"] .scroll-hint-gradient {
          opacity: 0;
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        :global([data-theme="dark"]) .scroll-hint-gradient {
          background: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 0.6) 100%);
        }
        
        .quick-filter-btn {
          flex-shrink: 0;
          padding: 9px 16px;
          font-size: 0.9375rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
          outline-offset: 2px;
          position: relative;
        }
        
        /* Only add extra padding-right when there's an info icon */
        div:has(.filter-info-icon-btn) .quick-filter-btn {
          padding-right: calc(16px + 20px + 8px);
        }
        
        /* Ensure "None" button (direct child of quick-filters-scroll) has symmetric padding */
        .quick-filters-scroll > .quick-filter-btn {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
        
        @media (max-width: 768px) {
          .quick-filter-btn {
            padding: 8px 14px;
          }
          
          div:has(.filter-info-icon-btn) .quick-filter-btn {
            padding-right: calc(14px + 18px + 8px);
          }
          
          .quick-filters-scroll > .quick-filter-btn {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }
        }
        
        .quick-filter-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
        }
        
        .quick-filter-btn.active {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.6);
          color: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.3);
        }
        
        .quick-filter-btn:active {
          transform: scale(0.98);
        }
        
        .filter-info-icon-btn {
          position: absolute;
          top: 50%;
          right: 16px;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(110, 198, 255, 0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(110, 198, 255, 0.4);
          border-radius: 50%;
          color: rgba(110, 198, 255, 1);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          outline-offset: 2px;
          z-index: 0;
        }
        
        .filter-info-icon-btn svg {
          width: 12px;
          height: 12px;
          display: block;
        }
        
        .filter-info-icon-btn:hover {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.6);
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.4);
        }
        
        .filter-info-icon-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        
        @media (max-width: 768px) {
          .quick-filters {
            margin-bottom: var(--spacing-xs);
          }
          
          .quick-filter-btn {
            padding: 8px 14px;
            font-size: 0.875rem;
          }
          
          div:has(.filter-info-icon-btn) .quick-filter-btn {
            padding-right: calc(14px + 18px + 8px);
          }
          
          .filter-info-icon-btn {
            width: 18px;
            height: 18px;
            right: 14px;
          }
          
          .filter-info-icon-btn svg {
            width: 10px;
            height: 10px;
          }
        }
        
        .filter-info-popover {
          position: fixed;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          max-width: 400px;
          width: calc(100vw - 40px);
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          transform: translateX(-50%);
          animation: popoverFadeIn 0.2s ease-out;
        }
        
        @keyframes popoverFadeIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .filter-popover-header {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background-color 0.2s ease;
        }
        
        .filter-popover-header:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        
        .filter-popover-header:active {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .filter-info-card-summary {
          flex: 1;
          min-width: 0;
        }
        
        .filter-popover-title-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .filter-popover-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 1);
          letter-spacing: -0.3px;
        }
        
        .filter-popover-severity {
          padding: 3px 10px;
          background: rgba(110, 198, 255, 0.15);
          border: 1px solid rgba(110, 198, 255, 0.3);
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(110, 198, 255, 1);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          line-height: 1.2;
        }
        
        .filter-popover-description {
          margin: 0 0 var(--spacing-md) 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.75);
          line-height: 1.5;
        }
        
        .filter-popover-stats {
          display: flex;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }
        
        .filter-popover-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .filter-popover-stat .stat-label {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 500;
        }
        
        .filter-popover-stat .stat-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .filter-info-card-toggle {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }
        
        .filter-popover-header:hover .filter-info-card-toggle {
          background: rgba(255, 255, 255, 0.12);
        }
        
        .toggle-icon {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-block;
        }
        
        .toggle-icon.expanded {
          transform: rotate(180deg);
        }
        
        .filter-popover-body {
          padding: var(--spacing-md);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.2);
          animation: expandContent 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes expandContent {
          from {
            opacity: 0;
            max-height: 0;
            padding-top: 0;
            padding-bottom: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
            padding-top: var(--spacing-md);
            padding-bottom: var(--spacing-md);
          }
        }
        
        .filter-popover-section {
          margin-bottom: var(--spacing-lg);
        }
        
        .filter-popover-section:last-child {
          margin-bottom: 0;
        }
        
        .filter-popover-section h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .filter-popover-section p {
          margin: 0;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }
        
        .filter-popover-section ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        
        .filter-popover-section ul li {
          position: relative;
          padding-left: 24px;
          margin-bottom: var(--spacing-sm);
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }
        
        .filter-popover-section ul li:before {
          content: '✓';
          position: absolute;
          left: 0;
          top: 0;
          color: rgba(110, 198, 255, 1);
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .filter-popover-section ul li:last-child {
          margin-bottom: 0;
        }
        
        @media (max-width: 768px) {
          .filter-info-card {
            margin-top: var(--spacing-xs);
            margin-bottom: var(--spacing-xs);
            border-radius: 10px;
          }
          
          .filter-popover-header {
            padding: var(--spacing-sm);
            gap: var(--spacing-sm);
          }
          
          .filter-popover-title {
            font-size: 0.95rem;
          }
          
          .filter-popover-description {
            font-size: 0.8rem;
            margin-bottom: var(--spacing-sm);
          }
          
          .filter-popover-stats {
            gap: var(--spacing-md);
          }
          
          .filter-popover-stat .stat-label {
            font-size: 0.65rem;
          }
          
          .filter-popover-stat .stat-value {
            font-size: 0.8rem;
          }
          
          .filter-popover-body {
            padding: var(--spacing-sm);
          }
          
          .filter-popover-section {
            margin-bottom: var(--spacing-md);
          }
          
          .filter-popover-section h4 {
            font-size: 0.75rem;
            margin-bottom: var(--spacing-xs);
          }
          
          .filter-popover-section p,
          .filter-popover-section ul li {
            font-size: 0.8rem;
          }
          
          .filter-popover-section ul li {
            padding-left: 20px;
            margin-bottom: var(--spacing-xs);
          }
        }
        
        .control-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          color: white;
          padding: 0;
          height: 48px;
          min-height: 48px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        .control-btn:has(.btn-icon:only-child) {
          padding: 0 16px;
          min-width: 48px;
          width: auto;
        }
        
        .control-btn:has(.split-view-popover) {
          position: relative;
          overflow: visible;
        }
        
        .control-btn.active {
          background: rgba(110, 198, 255, 0.1);
          border-color: rgba(110, 198, 255, 0.3);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.15),
                      0 0 0 1px rgba(110, 198, 255, 0.1);
        }
        
        .control-btn.active:hover:not(:disabled) {
          background: rgba(110, 198, 255, 0.15);
          border-color: rgba(110, 198, 255, 0.4);
          box-shadow: 0 4px 12px rgba(110, 198, 255, 0.2),
                      0 0 0 1px rgba(110, 198, 255, 0.15);
        }
        
        .control-btn:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.95);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
        }
        
        .control-btn.active:hover:not(:disabled) {
          transform: translateY(-2px);
        }
        
        .control-btn:has(.split-view-popover):hover:not(:disabled) {
          transform: none !important;
          padding: 0 16px !important;
          min-width: 48px !important;
          height: 48px !important;
        }
        
        .control-btn.active:has(.split-view-popover):hover:not(:disabled) {
          transform: none !important;
          padding: 0 16px !important;
          min-width: 48px !important;
          height: 48px !important;
        }
        
        .control-btn.refresh-btn:hover:not(:disabled) {
          transform: none !important;
        }
        
        .control-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        
        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .control-btn:disabled:hover {
          transform: none;
        }
        
        .btn-icon {
          font-size: 1.1rem;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          vertical-align: middle;
        }
        
        .btn-icon svg {
          display: block;
          flex-shrink: 0;
        }
        
        .btn-text {
          font-size: 0.85rem;
          letter-spacing: 0.3px;
        }
        
        /* Random button hint animation */
        @keyframes pulse-random-button {
          0%, 100% {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow: 0 6px 20px rgba(110, 198, 255, 0.5),
                        0 0 0 2px rgba(110, 198, 255, 0.3);
          }
        }
        
        .control-btn.random-btn {
          position: relative;
          overflow: visible;
        }
        
        .control-btn.random-btn.pulse-hint {
          animation: pulse-random-button 1.5s ease-in-out infinite;
        }
        
        .control-btn.random-btn:hover:not(:disabled) {
          transform: none !important;
          border-width: 1px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
          padding: 0 16px !important;
          min-width: 48px !important;
          height: 48px !important;
          transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .control-btn.random-btn:active:not(:disabled) {
          transform: none !important;
          padding: 0 16px !important;
          min-width: 48px !important;
          height: 48px !important;
          border-width: 1px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        .control-btn.random-btn.pulse-hint:hover:not(:disabled) {
          padding: 0 16px !important;
          min-width: 48px !important;
          height: 48px !important;
        }
        
        .random-popover {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                      0 2px 6px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .control-btn.random-btn:hover:not(:disabled) .random-popover {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        
        .split-view-popover {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3),
                      0 2px 6px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 0;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .control-btn:hover:not(:disabled) .split-view-popover {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        
        .split-view-popover::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid rgba(0, 0, 0, 0.85);
        }
        
        .random-popover::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid rgba(0, 0, 0, 0.85);
        }
        
        .random-hint-text {
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.95) 0%, rgba(74, 144, 226, 0.95) 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(110, 198, 255, 0.4),
                      0 2px 6px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }
        
        .random-hint-text:not(.hover-hint) {
          animation: fade-in-out-hint 4s ease-in-out forwards;
        }
        
        .random-hint-text.hover-hint {
          animation: none;
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
        
        .random-hint-text::after {
          content: '';
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(110, 198, 255, 0.95);
        }
        
        @keyframes fade-in-out-hint {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(8px) scale(0.9);
          }
          15% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          85% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-8px) scale(0.9);
          }
        }
        
        :global([data-theme="dark"]) .random-popover {
          background: rgba(40, 42, 54, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5),
                      0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        :global([data-theme="dark"]) .random-popover::after {
          border-top-color: rgba(40, 42, 54, 0.95);
        }
        
        :global([data-theme="dark"]) .split-view-popover {
          background: rgba(40, 42, 54, 0.95);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5),
                      0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        :global([data-theme="dark"]) .split-view-popover::after {
          border-top-color: rgba(40, 42, 54, 0.95);
        }
        
        :global([data-theme="dark"]) .random-hint-text {
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.98) 0%, rgba(74, 144, 226, 0.98) 100%);
          color: #0a0a1a;
          box-shadow: 0 4px 16px rgba(110, 198, 255, 0.5),
                      0 2px 8px rgba(0, 0, 0, 0.4);
        }
        
        :global([data-theme="dark"]) .random-hint-text::after {
          border-top-color: rgba(110, 198, 255, 0.98);
        }
        
        @media (max-width: 768px) {
          .random-popover {
            top: -35px;
            font-size: 0.7rem;
            padding: 5px 8px;
          }
          
          .split-view-popover {
            top: -35px;
            font-size: 0.7rem;
            padding: 5px 8px;
          }
          
          .random-hint-text {
            top: -30px;
            font-size: 0.7rem;
            padding: 5px 10px;
          }
        }
        
        :global([data-theme="dark"]) .control-btn.active {
          background: rgba(110, 198, 255, 0.12);
          border-color: rgba(110, 198, 255, 0.35);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.2),
                      0 0 0 1px rgba(110, 198, 255, 0.15);
        }
        
        :global([data-theme="dark"]) .control-btn.active:hover:not(:disabled) {
          background: rgba(110, 198, 255, 0.18);
          border-color: rgba(110, 198, 255, 0.45);
          box-shadow: 0 4px 12px rgba(110, 198, 255, 0.25),
                      0 0 0 1px rgba(110, 198, 255, 0.2);
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
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.95) 0%, 
            rgba(118, 75, 162, 0.95) 100%
          );
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          z-index: 5;
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                      background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .loading-state.initial-loading {
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.95) 0%, 
            rgba(118, 75, 162, 0.95) 100%
          );
        }
        
        .loading-state.iframe-loading {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.98) 0%, 
            rgba(250, 250, 255, 0.98) 100%
          );
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: var(--spacing-lg);
          padding: var(--spacing-xl);
          width: 100%;
          max-width: 600px;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .iframe-loading .loading-content {
          flex-direction: column;
        }
        
        .iframe-loading .loading-text-wrapper {
          order: -1;
          margin-bottom: var(--spacing-md);
        }
        
        /* Smooth transition between loading states */
        .loading-state.initial-loading .loading-content {
          animation: fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .loading-state.iframe-loading .loading-content {
          animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
        
        /* Orb Loading Animation - Initial Load */
        .loading-orb {
          position: relative;
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .orb-inner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(110, 198, 255, 0.8) 50%,
            rgba(255, 255, 255, 0.9) 100%
          );
          box-shadow: 
            0 0 40px rgba(110, 198, 255, 0.6),
            inset 0 0 30px rgba(255, 255, 255, 0.5),
            0 10px 40px rgba(0, 0, 0, 0.2);
          animation: orbFloat 3s ease-in-out infinite;
          position: relative;
          z-index: 3;
        }
        
        .orb-inner::before {
          content: '';
          position: absolute;
          top: 20%;
          left: 20%;
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          filter: blur(8px);
        }
        
        .orb-pulse {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 3px solid rgba(110, 198, 255, 0.6);
          animation: orbPulse 2s ease-out infinite;
        }
        
        .orb-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(circle, 
            rgba(110, 198, 255, 0.4) 0%, 
            transparent 70%
          );
          animation: orbGlow 2s ease-in-out infinite;
        }
        
        @keyframes orbFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }
        
        @keyframes orbPulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.8);
            opacity: 0;
          }
        }
        
        @keyframes orbGlow {
          0%, 100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.1);
          }
        }
        
        /* Skeleton Loading Animation - Iframe Load */
        .loading-skeleton {
          width: 100%;
          max-width: 500px;
          padding: var(--spacing-lg);
          background: rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .skeleton-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }
        
        .skeleton-body {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .skeleton-line,
        .skeleton-circle,
        .skeleton-box {
          background: linear-gradient(
            90deg,
            rgba(200, 200, 220, 0.3) 0%,
            rgba(220, 220, 240, 0.5) 50%,
            rgba(200, 200, 220, 0.3) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
        
        .skeleton-line {
          height: 16px;
          width: 100%;
        }
        
        .skeleton-line-short {
          width: 60%;
        }
        
        .skeleton-line-medium {
          width: 80%;
        }
        
        .skeleton-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }
        
        .skeleton-box {
          height: 120px;
          width: 100%;
          margin: var(--spacing-sm) 0;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        /* Loading Text */
        .loading-text-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          text-align: center;
        }
        
        .loading-title {
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          animation: titleFade 2s ease-in-out infinite;
        }
        
        .loading-subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.85);
          font-size: 0.95rem;
          font-weight: 400;
          letter-spacing: 0.5px;
        }
        
        .loading-text {
          margin: 0;
          color: rgba(100, 100, 120, 0.9);
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        @keyframes titleFade {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        /* Loading Dots */
        .loading-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 10px rgba(110, 198, 255, 0.6);
          animation: dotBounce 1.4s ease-in-out infinite;
        }
        
        .dot:nth-child(1) {
          animation-delay: 0s;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          40% {
            transform: translateY(-15px) scale(1.2);
            opacity: 0.8;
          }
        }
        
        /* Progress Bar */
        .loading-progress {
          width: 240px;
          height: 4px;
          background: rgba(200, 200, 220, 0.3);
          border-radius: 2px;
          overflow: hidden;
          margin-top: var(--spacing-xs);
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(
            90deg,
            rgba(102, 126, 234, 0.8) 0%,
            rgba(110, 198, 255, 0.9) 50%,
            rgba(118, 75, 162, 0.8) 100%
          );
          background-size: 200% 100%;
          animation: progressSlide 1.5s ease-in-out infinite;
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(110, 198, 255, 0.5);
        }
        
        @keyframes progressSlide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .loading-state,
          .orb-inner,
          .orb-pulse,
          .orb-glow,
          .skeleton-line,
          .skeleton-circle,
          .skeleton-box,
          .loading-title,
          .dot,
          .progress-bar,
          .scroll-hint-arrow {
            animation: none !important;
          }
          
          .loading-text::after {
            content: '...';
          }
        }
        
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          padding: var(--spacing-lg) var(--spacing-md);
          text-align: center;
          background: transparent;
          border-radius: var(--radius-md);
          border: none;
        }
        
        .error-icon {
          margin-bottom: var(--spacing-md);
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
          filter: drop-shadow(0 2px 6px rgba(110, 198, 255, 0.2));
        }
        
        .error-icon svg {
          width: 80px;
          height: 80px;
          max-width: 100%;
        }
        
        /* Light mode - higher contrast colors */
        .error-icon-bg {
          fill: rgba(110, 198, 255, 0.12);
        }
        
        .error-icon-main {
          /* Default colors work in light mode */
        }
        
        /* Dark mode - enhanced visibility */
        :global([data-theme="dark"]) .error-icon {
          filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4));
        }
        
        :global([data-theme="dark"]) .error-icon-bg {
          fill: rgba(110, 198, 255, 0.15);
        }
        
        :global([data-theme="dark"]) .error-icon svg .error-icon-main {
          /* SVG elements will use rgba colors that work in both modes */
          /* The colors are already theme-aware through opacity adjustments */
        }
        
        /* Ensure sufficient contrast in both modes */
        @media (prefers-contrast: high) {
          .error-icon-bg {
            fill: rgba(110, 198, 255, 0.2) !important;
          }
          
          :global([data-theme="dark"]) .error-icon-bg {
            fill: rgba(110, 198, 255, 0.25) !important;
          }
        }
        
        .error-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 1);
          margin: 0 0 var(--spacing-sm) 0;
          letter-spacing: -0.3px;
        }
        
        .error-message {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 var(--spacing-md) 0;
          max-width: 400px;
          line-height: 1.5;
        }
        
        .error-suggestions {
          background: rgba(255, 255, 255, 0.04);
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          margin-top: var(--spacing-md);
          max-width: 520px;
          text-align: left;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .error-suggestions-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .error-suggestions-list {
          margin: 0;
          padding-left: var(--spacing-md);
          list-style: none;
        }
        
        .error-suggestions-list li {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: var(--spacing-xs);
          line-height: 1.6;
          position: relative;
          padding-left: var(--spacing-md);
        }
        
        .error-suggestions-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: rgba(110, 198, 255, 0.8);
          font-weight: 700;
        }
        
        .error-suggestions-list li:last-child {
          margin-bottom: 0;
        }
        
        .error-cta-button {
          background: rgba(110, 198, 255, 0.9);
          border: none;
          border-radius: var(--radius-sm);
          color: rgba(255, 255, 255, 1);
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          margin-bottom: 0;
          box-shadow: 0 2px 6px rgba(110, 198, 255, 0.25);
          letter-spacing: 0.2px;
        }
        
        .error-cta-button:hover {
          background: rgba(110, 198, 255, 1);
          transform: translateY(-1px);
          box-shadow: 0 3px 10px rgba(110, 198, 255, 0.35);
        }
        
        .error-cta-button:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(110, 198, 255, 0.25);
        }
        
        .error-cta-button:focus-visible {
          outline: 2px solid rgba(110, 198, 255, 0.8);
          outline-offset: 2px;
        }
        
        .iframe-content {
          flex: 1;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .iframe-content:not(.loading) {
          opacity: 1;
          pointer-events: auto;
        }
        
        .iframe-content.loading {
          opacity: 0;
          pointer-events: none;
        }
        
        @keyframes fadeInContent {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .iframe-wrapper {
          width: 100%;
          height: 100%;
          flex: 1;
          background: white;
          transition: filter var(--transition-normal);
          position: relative;
          overflow: hidden;
        }
        
        .website-iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
        }
        
        /* Remove white overlays that were interfering with loading */
        
        .split-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        
        .split-pane {
          position: absolute;
          top: 0;
          bottom: 0;
          overflow: hidden;
        }
        
        .split-pane-left {
          left: 0;
          width: 50%;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .split-pane-right {
          right: 0;
          width: 50%;
        }
        
        .split-label {
          position: absolute;
          top: 8px;
          z-index: 10;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: white;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          pointer-events: auto;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          letter-spacing: 0.3px;
          transition: background-color 0.3s ease;
          cursor: default;
        }
        
        .split-label:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        
        .split-label-left {
          left: 8px;
        }
        
        .split-label-right {
          left: calc(50% + 8px);
        }
        
        .split-view-wrapper {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          flex: 1;
          min-height: 0;
        }
        
        .split-view-wrapper .split-container {
          flex: 1;
          min-height: 0;
        }
        
        .split-labels-mobile {
          display: none;
          flex-direction: row;
          gap: 0;
          width: 100%;
          margin-bottom: 2px;
        }
        
        .split-label-mobile {
          flex: 1;
          text-align: center;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          font-size: 0.85rem;
          font-weight: 600;
          pointer-events: none;
        }
        
        .split-label-mobile:first-child {
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }
        
        .split-label-mobile:last-child {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        
        .split-label-desktop {
          display: block;
        }
        
        @media (max-width: 768px) {
          .split-labels-mobile {
            display: flex;
          }
          
          .split-label-desktop {
            display: none;
          }
        }
        
        .split-divider {
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          background: rgba(255, 255, 255, 0.3);
          transform: translateX(-50%);
          z-index: 10;
          pointer-events: none;
        }
        
        @media (max-width: 768px) {
          .website-viewer-container {
            min-height: 500px;
          }
          
          .error-state {
            padding: var(--spacing-lg);
          }
          
          .error-icon {
            margin-bottom: var(--spacing-md);
          }
          
          .error-icon svg {
            width: 90px;
            height: 90px;
          }
          
          .error-title {
            font-size: 1.25rem;
          }
          
          .error-message {
            font-size: 0.95rem;
          }
          
          .error-suggestions {
            padding: var(--spacing-sm);
          }
        }
        
        @media (max-width: 480px) {
          .website-viewer-container {
            min-height: 400px;
          }
          
          .error-state {
            padding: var(--spacing-md);
          }
          
          .error-icon {
            margin-bottom: var(--spacing-sm);
          }
          
          .error-icon svg {
            width: 80px;
            height: 80px;
          }
          
          .error-title {
            font-size: 1.1rem;
          }
          
          .error-message {
            font-size: 0.9rem;
          }
          
          .error-suggestions-list li {
            font-size: 0.85rem;
          }
          
          .error-action-button {
            width: 100%;
            padding: var(--spacing-sm);
          }
          
          .empty-state {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  )
})

/**
 * Get CSS filter style for active filter
 * @param {string} filterId - Filter ID
 * @param {boolean} isMobileDevice - Whether running on mobile device
 * @returns {string} CSS filter value
 */
function getFilterStyle(filterId, isMobileDevice = false) {
  // Use CSS filters instead of SVG filters on mobile
  // SVG filters don't work reliably on mobile browsers when applied to iframes
  const isMobile = isMobileDevice || (typeof window !== 'undefined' && 
    (window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)))
  
  // Map filter IDs to CSS filter values
  const filters = {
    none: 'none',
    // Protanopia: Red-blind - reduce red channel, shift colors
    protanopia: isMobile 
      ? 'contrast(1.15) saturate(0.4) brightness(1.05) sepia(0.1) hue-rotate(15deg)' 
      : 'url(#protanopia)',
    // Deuteranopia: Green-blind - reduce green channel, shift colors  
    deuteranopia: isMobile
      ? 'contrast(1.1) saturate(0.35) brightness(1.05) sepia(0.15) hue-rotate(-10deg)'
      : 'url(#deuteranopia)',
    // Tritanopia: Blue-blind - reduce blue/yellow distinction
    tritanopia: isMobile
      ? 'contrast(1.1) saturate(0.5) brightness(1.05) sepia(0.2) hue-rotate(25deg)'
      : 'url(#tritanopia)',
    achromatopsia: 'grayscale(100%)',
    cataracts: 'blur(2px) contrast(0.7) brightness(0.8)',
    lowVision: 'blur(3px)',
    lowContrast: 'contrast(0.5) brightness(0.9)',
    // Protanomaly: Red-weak - milder version
    protanomaly: isMobile
      ? 'contrast(1.08) saturate(0.6) brightness(1.02) sepia(0.05) hue-rotate(8deg)'
      : 'url(#protanomaly)',
    // Deuteranomaly: Green-weak - milder version
    deuteranomaly: isMobile
      ? 'contrast(1.05) saturate(0.55) brightness(1.02) sepia(0.08) hue-rotate(-5deg)'
      : 'url(#deuteranomaly)',
    glaucoma: 'brightness(0.6) contrast(0.7) blur(1px)',
    macularDegeneration: 'blur(4px) contrast(0.6) brightness(0.7)',
    diabeticRetinopathy: 'blur(2px) contrast(0.7) brightness(0.85)',
  }
  
  return filters[filterId] || 'none'
}


