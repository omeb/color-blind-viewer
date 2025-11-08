'use client'

import React from 'react'

// Example sites to always show (colorful sites for testing colorblind filters)
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
 * History Section Component
 * 
 * Displays a list of recently viewed websites with the ability to:
 * - Click to quickly load a site
 * - Remove sites from history
 * - Automatically moves most recent to top
 * - Always shows example sites for easy access
 * 
 * @param {Object} props
 * @param {Array<string>} props.history - Array of URLs in history
 * @param {Function} props.onSelectUrl - Callback when URL is clicked
 * @param {Function} props.onRemoveUrl - Callback to remove URL from history
 */
export default function HistorySection({ history = [], onSelectUrl, onRemoveUrl, hideRecent = false }) {
  
  // Freeze history snapshot when hideRecent is true (during navigation)
  const frozenHistoryRef = React.useRef(null)
  
  React.useEffect(() => {
    if (!hideRecent) {
      // When not hiding, update the frozen snapshot
      frozenHistoryRef.current = history
    }
    // When hideRecent is true, keep the old snapshot
  }, [history, hideRecent])
  
  // Use frozen history if hideRecent is true, otherwise use current history
  const displayHistory = hideRecent && frozenHistoryRef.current !== null 
    ? frozenHistoryRef.current 
    : history
  
  // Normalize and filter history prop
  const normalizedHistory = React.useMemo(() => {
    if (!displayHistory) return []
    if (!Array.isArray(displayHistory)) return []
    return displayHistory.filter(url => url && typeof url === 'string' && url.trim().length > 0)
  }, [displayHistory])
  
  // Filter out example sites from history to avoid duplicates
  const filteredHistory = React.useMemo(() => {
    return normalizedHistory.filter(url => !EXAMPLE_SITES.includes(url))
  }, [normalizedHistory])
  
  // Handle removal - directly call onRemoveUrl, parent state will update
  const handleRemove = (url) => {
    if (onRemoveUrl) {
      onRemoveUrl(url)
    }
  }
  
  // Handle clear all recent sites
  const handleClearAll = () => {
    // Call onRemoveUrl for each item - parent state will update
    filteredHistory.forEach(url => {
      if (onRemoveUrl) {
        onRemoveUrl(url)
      }
    })
  }
  
  // Extract domain name from URL for display
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
  
  // Render a single site item
  const renderSiteItem = (url, index, isExample = false) => (
    <div key={`${url}-${index}`} className={`history-item ${!isExample ? 'history-item-removable history-item-recent' : 'history-item-example'}`}>
      <button
        onClick={() => onSelectUrl(url)}
        className="history-button"
        title={`Load ${url}`}
      >
        <span className="history-icon">🌐</span>
        <span className="history-url">{getDisplayUrl(url)}</span>
      </button>
      {!isExample && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleRemove(url)
          }}
          className="history-remove"
          aria-label={`Remove ${url} from history`}
          title="Remove from history"
        >
          ✕
        </button>
      )}
    </div>
  )
  
  return (
    <div className="history-section">
      {/* Recent Sites Section */}
      {filteredHistory.length > 0 && (
        <div className="history-group history-group-recent">
          <div className="history-header">
            <h3 className="history-title history-title-recent">Recent Sites</h3>
            <button
              onClick={handleClearAll}
              className="history-clear-btn"
              aria-label="Clear all recent sites"
              title="Clear all"
            >
              Clear all
            </button>
          </div>
          <div className="history-list">
            {filteredHistory.map((url, index) => renderSiteItem(url, index, false))}
          </div>
        </div>
      )}
      
      {/* Example Sites Section */}
      <div className="history-group history-group-example">
        <div className="history-header">
          <h3 className="history-title history-title-example">Example Sites</h3>
        </div>
        <div className="history-list">
          {EXAMPLE_SITES.map((url, index) => renderSiteItem(url, index, true))}
        </div>
      </div>

    </div>
  )
}

