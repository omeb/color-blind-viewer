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

      <style jsx>{`
        .history-section {
          margin-top: var(--spacing-lg);
        }

        .history-group {
          margin-bottom: var(--spacing-lg);
        }

        .history-group:last-child {
          margin-bottom: 0;
        }

        .history-header {
          margin-bottom: 12px;
        }

        .history-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 1);
          margin: 0 0 12px 0;
          text-align: left;
          letter-spacing: -0.02em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .history-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .history-item {
          position: relative;
          display: inline-flex;
          align-items: stretch;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1),
                      0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .history-item:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15),
                      0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .history-button {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.95);
          padding: 10px 16px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          flex: 1;
          min-width: 0;
        }
        
        .history-button:hover {
          color: rgba(255, 255, 255, 1);
        }
        
        .history-button:hover .history-url {
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
        }
        
        .history-button:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.8);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .history-icon {
          font-size: 1rem;
          line-height: 1;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .history-url {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex-shrink: 1;
          min-width: 0;
          letter-spacing: -0.01em;
        }

        .history-remove {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          color: white;
          padding: 0 12px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.2s ease;
          border-radius: 0 20px 20px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          z-index: 10;
        }

        .history-item:hover .history-remove {
          opacity: 1;
          transform: translateX(0);
        }

        .history-remove:hover {
          background: rgba(220, 38, 38, 1);
        }

        .history-remove:active {
          transform: translateX(0) scale(0.95);
        }
        
        @media (max-width: 768px) {
          .history-url {
            max-width: 140px;
          }
        }

        @media (max-width: 480px) {
          .history-url {
            max-width: 100px;
          }
        }
      `}</style>
    </div>
  )
}

