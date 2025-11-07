'use client'

import React from 'react'
import { getCategorizedFilters, getFilter, getAllFilterIds } from '../lib/filters'

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
export default function WebsiteViewer({ url, activeFilter = 'none', isSplitView: isSplitViewProp, onSplitViewChange, onFilterRemove, onFilterChange, onFilterInfo, onChangeUrl, loading = false, error = null, onUrlChange, history = [], onSelectUrl, onRemoveUrl }) {
  const [iframeKey, setIframeKey] = React.useState(0)
  const [isSplitView, setIsSplitView] = React.useState(isSplitViewProp || false)
  const [iframeLoading, setIframeLoading] = React.useState(false)
  const [iframeLoaded, setIframeLoaded] = React.useState(false)
  const [isEditingUrl, setIsEditingUrl] = React.useState(false)
  const [editedUrl, setEditedUrl] = React.useState(url)
  const [showHistoryDropdown, setShowHistoryDropdown] = React.useState(false)
  const historyDropdownRef = React.useRef(null)
  const iframeRef = React.useRef(null)
  const originalIframeRef = React.useRef(null)
  const filteredIframeRef = React.useRef(null)
  const splitContainerRef = React.useRef(null)
  const containerRef = React.useRef(null)
  const urlInputRef = React.useRef(null)
  const isScrollingRef = React.useRef(false)
  
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
    
    const handleOriginalScroll = () => {
      if (isScrollingRef.current) return
      isScrollingRef.current = true
      
      try {
        const originalDoc = originalIframe.contentDocument || originalIframe.contentWindow.document
        const filteredDoc = filteredIframe.contentDocument || filteredIframe.contentWindow.document
        
        if (originalDoc && filteredDoc) {
          filteredDoc.documentElement.scrollTop = originalDoc.documentElement.scrollTop
          filteredDoc.documentElement.scrollLeft = originalDoc.documentElement.scrollLeft
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
      
      setTimeout(() => {
        isScrollingRef.current = false
      }, 10)
    }
    
    const handleFilteredScroll = () => {
      if (isScrollingRef.current) return
      isScrollingRef.current = true
      
      try {
        const originalDoc = originalIframe.contentDocument || originalIframe.contentWindow.document
        const filteredDoc = filteredIframe.contentDocument || filteredIframe.contentWindow.document
        
        if (originalDoc && filteredDoc) {
          originalDoc.documentElement.scrollTop = filteredDoc.documentElement.scrollTop
          originalDoc.documentElement.scrollLeft = filteredDoc.documentElement.scrollLeft
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
      
      setTimeout(() => {
        isScrollingRef.current = false
      }, 10)
    }
    
    // Wait for iframes to load before attaching listeners
    const attachListeners = () => {
      try {
        const originalWindow = originalIframe.contentWindow
        const filteredWindow = filteredIframe.contentWindow
        
        if (originalWindow) {
          originalWindow.addEventListener('scroll', handleOriginalScroll, { passive: true })
        }
        if (filteredWindow) {
          filteredWindow.addEventListener('scroll', handleFilteredScroll, { passive: true })
        }
      } catch (e) {
        // Cross-origin restrictions may prevent access
      }
    }
    
    // Try to attach listeners immediately and after a delay
    attachListeners()
    const timeout = setTimeout(attachListeners, 1000)
    
    return () => {
      clearTimeout(timeout)
      try {
        const originalWindow = originalIframe.contentWindow
        const filteredWindow = filteredIframe.contentWindow
        
        if (originalWindow) {
          originalWindow.removeEventListener('scroll', handleOriginalScroll)
        }
        if (filteredWindow) {
          filteredWindow.removeEventListener('scroll', handleFilteredScroll)
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
  
  // Build proxy URL
  const proxyUrl = url ? `/api/proxy?url=${encodeURIComponent(url)}` : null
  
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
  
  // Reload iframe when URL changes
  React.useEffect(() => {
    if (url) {
      setIframeKey(prev => prev + 1)
      setIframeLoading(true)
      setIframeLoaded(false)
    } else {
      // Reset loading states when URL is cleared
      setIframeLoading(false)
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
    const domain = pathMatch ? pathMatch[1] : rest
    const path = pathMatch ? pathMatch[2] : ''
    
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
                            <span className="history-item-url">{historyUrl}</span>
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
            <button
              onClick={handleRefresh}
              className="control-btn"
              aria-label="Refresh page"
              title="Refresh"
              disabled={loading || iframeLoading}
            >
              <span className="btn-icon">↻</span>
            </button>
            
            
            {activeFilter !== 'none' && (
              <>
                <button
                  onClick={handleSplitViewToggle}
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
        className={`website-viewer-container ${isSplitView ? 'split-view' : ''}`}
      >
      
      {!url && !loading && !error && (
        <div className="empty-state">
          <p>Enter a website URL above to get started</p>
          <p className="hint">Try: wix.com, github.com, or any website you want to test</p>
        </div>
      )}
      
      {/* Show loading state immediately when url exists OR loading is true */}
      {(loading || iframeLoading || (url && !iframeLoaded)) && (
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
      
      {error && (() => {
        // Parse error message to determine error type
        const errorLower = error.toLowerCase()
        let errorType = 'generic'
        let userFriendlyTitle = 'Unable to Load Website'
        let userFriendlyMessage = 'We couldn\'t load this website. This might be due to security restrictions or network issues.'
        let suggestions = [
          'Try a different website URL',
          'Check if the website is accessible in your browser',
          'Some sites block embedding for security reasons'
        ]
        
        if (errorLower.includes('403') || errorLower.includes('forbidden')) {
          errorType = 'forbidden'
          userFriendlyTitle = 'Access Restricted'
          userFriendlyMessage = 'This website has blocked embedding for security reasons. Many sites restrict iframe embedding to protect their content.'
          suggestions = [
            'Try opening the site directly in your browser',
            'Try a different website that allows embedding',
            'Some sites like social media platforms restrict embedding'
          ]
        } else if (errorLower.includes('404') || errorLower.includes('not found')) {
          errorType = 'notfound'
          userFriendlyTitle = 'Website Not Found'
          userFriendlyMessage = 'The website you\'re looking for couldn\'t be found. It may have been moved or doesn\'t exist.'
          suggestions = [
            'Double-check the URL for typos',
            'Try removing www. or adding it',
            'Verify the website is still active'
          ]
        } else if (errorLower.includes('timeout') || errorLower.includes('too long')) {
          errorType = 'timeout'
          userFriendlyTitle = 'Request Timed Out'
          userFriendlyMessage = 'The website took too long to respond. This could be due to slow loading or server issues.'
          suggestions = [
            'Try again in a few moments',
            'Check your internet connection',
            'The site might be experiencing high traffic'
          ]
        } else if (errorLower.includes('network') || errorLower.includes('connection')) {
          errorType = 'network'
          userFriendlyTitle = 'Connection Error'
          userFriendlyMessage = 'We couldn\'t connect to the website. Please check your internet connection.'
          suggestions = [
            'Check your internet connection',
            'Try refreshing the page',
            'Verify the website URL is correct'
          ]
        } else if (errorLower.includes('html page') || errorLower.includes('not html')) {
          errorType = 'nothtml'
          userFriendlyTitle = 'Not a Web Page'
          userFriendlyMessage = 'This URL doesn\'t point to a web page. It might be a file download or API endpoint.'
          suggestions = [
            'Make sure you\'re using a website URL, not a file link',
            'Try the main page of the website',
            'Some URLs point to downloads or APIs, not web pages'
          ]
        }
        
        return (
          <div className="error-state" role="alert">
            <div className="error-icon">
              {errorType === 'forbidden' && '🚫'}
              {errorType === 'notfound' && '🔍'}
              {errorType === 'timeout' && '⏱️'}
              {errorType === 'network' && '📡'}
              {errorType === 'nothtml' && '📄'}
              {errorType === 'generic' && '⚠️'}
            </div>
            <h3 className="error-title">{userFriendlyTitle}</h3>
            <p className="error-message">{userFriendlyMessage}</p>
            <div className="error-suggestions">
              <p className="error-suggestions-title">What you can try:</p>
              <ul className="error-suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
            {onChangeUrl && (
              <button
                onClick={() => onChangeUrl()}
                className="error-action-button"
              >
                Try a Different URL
              </button>
            )}
          </div>
        )
      })()}
      
      {proxyUrl && !loading && !error && (
        <div className={`iframe-content ${iframeLoading ? 'loading' : ''}`}>
          {isSplitView && activeFilter !== 'none' ? (
            <div className="split-container" ref={splitContainerRef}>
              <div className="split-pane split-pane-left">
                {!iframeLoading && <div className="split-label">Original</div>}
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
                {!iframeLoading && <div className="split-label">With Filter</div>}
                <div 
                  className="iframe-wrapper filtered"
                  style={{ filter: getFilterStyle(activeFilter) }}
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
        </div>
      )}
      </div>
      
      {/* Quick Filter Buttons - Right beneath the viewer */}
      {url && (
        <div className="quick-filters">
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
              <button
                key={filter.id}
                onClick={() => {
                  onFilterChange && onFilterChange(filter.id)
                }}
                className={`quick-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                title="Click to apply filter"
              >
                {filter.name}
              </button>
            ))}
            {getCategorizedFilters().other.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  onFilterChange && onFilterChange(filter.id)
                }}
                className={`quick-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                title="Click to apply filter"
              >
                {filter.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
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
        
        .website-viewer-container.split-view {
        }
        
        
        
        
        
        
        .viewer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
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
            justify-content: flex-start;
            gap: var(--spacing-xs);
            margin-top: var(--spacing-xs);
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
        
        .url-edit-input {
          flex: 1;
          min-width: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid rgba(74, 144, 226, 0.6);
          border-radius: 8px;
          padding: 10px 14px;
          box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
          animation: expandIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        
        .url-input-wrapper {
          flex: 1;
          position: relative;
        }
        
        .history-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
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
          color: rgba(0, 0, 0, 0.9);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          letter-spacing: -0.01em;
          line-height: 1.5;
          outline: none;
          padding: 0;
        }
        
        .url-edit-input::placeholder {
          color: rgba(0, 0, 0, 0.5);
          font-weight: 400;
          letter-spacing: 0;
        }
        
        .url-edit-actions {
          display: flex;
          gap: 6px;
        }
        
        .url-action-btn {
          border: none;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          line-height: 1;
          font-weight: 600;
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
          margin-top: var(--spacing-md);
          margin-bottom: var(--spacing-sm);
          width: 100%;
          max-width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .quick-filters::-webkit-scrollbar {
          height: 4px;
        }
        
        .quick-filters::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .quick-filters::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        
        .quick-filters-scroll {
          display: flex;
          gap: 12px;
          padding-bottom: 4px;
          min-width: 0;
          flex: 1;
        }
        
        .quick-filter-btn {
          flex-shrink: 0;
          padding: 6px 12px;
          font-size: 0.75rem;
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
        }
        
        .quick-filter-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
        
        .quick-filter-btn.active {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.6);
          color: rgba(255, 255, 255, 1);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.3);
        }
        
        .quick-filter-btn:active {
          transform: translateY(0);
        }
        
        .filter-info-icon-btn {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
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
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
          padding: 0;
          outline-offset: 2px;
        }
        
        .filter-info-icon-btn:hover {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.6);
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(110, 198, 255, 0.4);
        }
        
        .filter-info-icon-btn:active {
          transform: scale(0.95);
        }
        
        @media (max-width: 768px) {
          .quick-filters {
            margin-bottom: var(--spacing-xs);
          }
          
          .quick-filter-btn {
            padding: 5px 10px;
            font-size: 0.7rem;
          }
          
          .filter-info-icon-btn {
            width: 24px;
            height: 24px;
            font-size: 0.75rem;
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
        
        .control-btn:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.95);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
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
          .progress-bar {
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
          height: 100%;
          padding: var(--spacing-xl);
          text-align: center;
          background: rgba(255, 107, 107, 0.08);
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 107, 107, 0.2);
        }
        
        .error-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-md);
          line-height: 1;
        }
        
        .error-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 1);
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .error-message {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0 0 var(--spacing-lg) 0;
          max-width: 500px;
          line-height: 1.6;
        }
        
        .error-suggestions {
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          max-width: 500px;
          text-align: left;
        }
        
        .error-suggestions-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
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
        
        .error-action-button {
          background: rgba(110, 198, 255, 0.2);
          border: 1px solid rgba(110, 198, 255, 0.4);
          border-radius: var(--radius-sm);
          color: rgba(255, 255, 255, 1);
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: inherit;
        }
        
        .error-action-button:hover {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.6);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(110, 198, 255, 0.2);
        }
        
        .error-action-button:active {
          transform: translateY(0);
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
            font-size: 3rem;
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
            font-size: 2.5rem;
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
    protanomaly: 'url(#protanomaly)',
    deuteranomaly: 'url(#deuteranomaly)',
    glaucoma: 'brightness(0.6) contrast(0.7) blur(1px)',
    macularDegeneration: 'blur(4px) contrast(0.6) brightness(0.7)',
    diabeticRetinopathy: 'blur(2px) contrast(0.7) brightness(0.85)',
  }
  
  return filters[filterId] || 'none'
}


