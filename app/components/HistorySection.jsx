'use client'

import React from 'react'

/**
 * History Section Component
 * 
 * Displays a list of recently viewed websites with the ability to:
 * - Click to quickly load a site
 * - Remove sites from history
 * - Automatically moves most recent to top
 * 
 * @param {Object} props
 * @param {Array<string>} props.history - Array of URLs in history
 * @param {Function} props.onSelectUrl - Callback when URL is clicked
 * @param {Function} props.onRemoveUrl - Callback to remove URL from history
 */
export default function HistorySection({ history = [], onSelectUrl, onRemoveUrl }) {
  const exampleSites = [
    'https://www.wix.com',
    'https://www.github.com',
    'https://www.wikipedia.org',
    'https://www.reddit.com',
    'https://www.stackoverflow.com'
  ]
  
  // Ensure history is an array and show examples if empty
  // Handle cases where history might be null, undefined, or not an array
  const historyArray = React.useMemo(() => {
    if (!history) return []
    if (!Array.isArray(history)) return []
    // Filter out any invalid entries
    return history.filter(url => url && typeof url === 'string' && url.trim().length > 0)
  }, [history])
  
  const sitesToShow = historyArray.length > 0 ? historyArray : exampleSites
  const isShowingExamples = historyArray.length === 0
  
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
  
  return (
    <div className="history-section">
      <div className="history-header">
        <h3 className="history-title">{isShowingExamples ? 'Example Sites' : 'Recent Sites'}</h3>
      </div>
      <div className="history-list">
        {sitesToShow.map((url, index) => (
          <div key={`${url}-${index}`} className="history-item">
            <button
              onClick={() => onSelectUrl(url)}
              className="history-button"
              title={`Load ${url}`}
            >
              <span className="history-icon">🌐</span>
              <span className="history-url">{getDisplayUrl(url)}</span>
            </button>
            {!isShowingExamples && (
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
        ))}
      </div>

      <style jsx>{`
        .history-section {
          margin-top: var(--spacing-lg);
        }

        .history-header {
          margin-bottom: var(--spacing-sm);
        }

        .history-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 1);
          margin: 0;
          text-align: left;
        }

        .history-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .history-item {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .history-item:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-1px);
        }

        .history-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 1);
          padding: 8px 12px;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        
        .history-button:hover {
          color: rgba(255, 255, 255, 1);
        }
        
        .history-button:hover .history-url {
          text-decoration: underline;
          text-decoration-thickness: 1.5px;
          text-underline-offset: 2px;
        }
        
        .history-button:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.8);
          outline-offset: 2px;
          border-radius: 4px;
        }

        .history-icon {
          font-size: 0.9rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .history-url {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-remove {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          color: white;
          padding: 0 10px;
          font-size: 0.9rem;
          cursor: pointer;
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.2s ease;
          border-radius: 0 20px 20px 0;
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

