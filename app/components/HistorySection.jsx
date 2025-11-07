'use client'

import React from 'react'

// Example sites to always show (colorful sites for testing colorblind filters)
const EXAMPLE_SITES = [
  'https://www.wix.com',
  'https://www.spotify.com',
  'https://www.dribbble.com',
  'https://www.behance.net',
  'https://www.airbnb.com',
  'https://www.stripe.com',
  'https://www.notion.so',
  'https://www.unsplash.com'
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
export default function HistorySection({ history = [], onSelectUrl, onRemoveUrl }) {
  
  // Ensure history is an array
  // Handle cases where history might be null, undefined, or not an array
  const historyArray = React.useMemo(() => {
    if (!history) return []
    if (!Array.isArray(history)) return []
    // Filter out any invalid entries
    return history.filter(url => url && typeof url === 'string' && url.trim().length > 0)
  }, [history])
  
  // Filter out example sites from history to avoid duplicates
  const filteredHistory = React.useMemo(() => {
    return historyArray.filter(url => !EXAMPLE_SITES.includes(url))
  }, [historyArray])
  
  // Extract domain name from URL for display
  const getDisplayUrl = (url) => {
    try {
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
    <div key={`${url}-${index}`} className="history-item">
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
            onRemoveUrl(url)
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
        <div className="history-group">
          <div className="history-header">
            <h3 className="history-title">Recent Sites</h3>
          </div>
          <div className="history-list">
            {filteredHistory.map((url, index) => renderSiteItem(url, index, false))}
          </div>
        </div>
      )}
      
      {/* Example Sites Section */}
      <div className="history-group">
        <div className="history-header">
          <h3 className="history-title">Example Sites</h3>
        </div>
        <div className="history-list">
          {EXAMPLE_SITES.map((url, index) => renderSiteItem(url, index, true))}
        </div>
      </div>

    </div>
  )
}

