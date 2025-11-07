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
  if (!history || history.length === 0) {
    return null
  }

  return (
    <div className="history-section">
      <div className="history-header">
        <h3 className="history-title">Recent Sites</h3>
      </div>
      <div className="history-list">
        {history.map((url, index) => (
          <div key={`${url}-${index}`} className="history-item">
            <button
              onClick={() => onSelectUrl(url)}
              className="history-button"
              title={`Load ${url}`}
            >
              <span className="history-icon">🌐</span>
              <span className="history-url">{url}</span>
            </button>
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
          color: rgba(255, 255, 255, 0.9);
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
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .history-item:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        .history-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.95);
          padding: 8px 12px;
          font-size: 0.85rem;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.2s ease;
        }

        .history-button:hover {
          color: white;
        }

        .history-icon {
          font-size: 0.9rem;
          line-height: 1;
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

