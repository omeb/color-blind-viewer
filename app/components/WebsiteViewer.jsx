'use client'

import React from 'react'
import { getCategorizedFilters } from '../lib/filters'

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
export default function WebsiteViewer({ url, activeFilter = 'none', onFilterRemove, onFilterChange, onFilterInfo, onChangeUrl, loading = false, error = null, onUrlChange, history = [], onSelectUrl, onRemoveUrl }) {
  const [iframeKey, setIframeKey] = React.useState(0)
  const [isSplitView, setIsSplitView] = React.useState(false)
  const [iframeLoading, setIframeLoading] = React.useState(false)
  const [iframeLoaded, setIframeLoaded] = React.useState(false)
  const [isEditingUrl, setIsEditingUrl] = React.useState(false)
  const [editedUrl, setEditedUrl] = React.useState(url)
  const [showHistoryDropdown, setShowHistoryDropdown] = React.useState(false)
  const historyDropdownRef = React.useRef(null)
  const iframeRef = React.useRef(null)
  const containerRef = React.useRef(null)
  const urlInputRef = React.useRef(null)
  
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
  
  // Handle URL submit
  const handleUrlSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevent any event bubbling
    
    // Always close dropdown on submit
    setShowHistoryDropdown(false)
    
    if (editedUrl.trim() && onUrlChange) {
      let formattedUrl = editedUrl.trim()
      
      // Remove spaces
      formattedUrl = formattedUrl.replace(/\s+/g, '')
      
      // Fix common typos: replace -com, -org, -net with .com, .org, .net
      formattedUrl = formattedUrl.replace(/-(com|org|net|io|co|edu|gov)$/i, '.$1')
      
      // Always add https:// if no protocol specified
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
      
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
                        <button
                          key={`${historyUrl}-${index}`}
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
                        </button>
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
        className={`website-viewer-container ${isSplitView ? 'split-view' : ''}`}
      >
      
      {!url && !loading && !error && (
        <div className="empty-state">
          <p>Enter a website URL above to get started</p>
          <p className="hint">Try: wix.com, github.com, or any website you want to test</p>
        </div>
      )}
      
      {loading && (
        <div className="loading-state" role="status" aria-live="polite">
          <div className="loading-content">
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
          </div>
        </div>
      )}
      
      {!loading && iframeLoading && (
        <div className="loading-state iframe-loading" role="status" aria-live="polite">
          <div className="loading-content">
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
        <div className={`iframe-content ${iframeLoading ? 'loading' : ''}`}>
          {isSplitView && activeFilter !== 'none' ? (
            <div className="split-container">
              <div className="split-pane split-pane-left">
                {!iframeLoading && <div className="split-label">Original</div>}
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
              
              <div className="split-divider"></div>
              
              <div className="split-pane split-pane-right">
                {!iframeLoading && <div className="split-label">With Filter</div>}
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
          flex: 1;
          min-height: 600px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          transition: all var(--transition-normal);
          display: flex;
          flex-direction: column;
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
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
          display: flex;
          align-items: center;
          gap: 8px;
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
        
        .history-dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transition: background var(--transition-fast);
          text-align: left;
          font-size: 0.9rem;
        }
        
        .history-dropdown-item:hover {
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
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          font-size: 0.9rem;
          opacity: 0;
        }
        
        .history-dropdown-item:hover .history-item-remove {
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
          font-size: 0.9rem;
          color: rgba(0, 0, 0, 0.9);
          font-family: monospace;
          letter-spacing: -0.3px;
          outline: none;
          padding: 0;
        }
        
        .url-edit-input::placeholder {
          color: rgba(0, 0, 0, 0.4);
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
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
        }
        
        .iframe-loading .loading-content {
          flex-direction: column;
        }
        
        .iframe-loading .loading-text-wrapper {
          order: -1;
          margin-bottom: var(--spacing-md);
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
        
        .iframe-content {
          flex: 1;
          position: relative;
          width: 100%;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
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
        }
        
        @media (max-width: 480px) {
          .website-viewer-container {
            min-height: 400px;
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
    protanomaly: 'url(#protanomaly)',
    deuteranomaly: 'url(#deuteranomaly)',
    glaucoma: 'brightness(0.6) contrast(0.7) blur(1px)',
    macularDegeneration: 'blur(4px) contrast(0.6) brightness(0.7)',
    diabeticRetinopathy: 'blur(2px) contrast(0.7) brightness(0.85)',
  }
  
  return filters[filterId] || 'none'
}


