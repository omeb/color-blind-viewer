'use client'

import React from 'react'
import { getFilter } from '../lib/filters'

/**
 * Info Panel Component
 * 
 * Displays educational information about vision impairments and
 * details about the currently active filter.
 * 
 * @param {Object} props
 * @param {string} props.activeFilter - Currently active filter ID
 * @param {boolean} props.showHeader - Whether to show the collapsible header (default: true)
 * @param {Function} props.onClose - Optional callback when close button is clicked
 */
export default function InfoPanel({ activeFilter = 'none', showHeader = true, onClose }) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const filter = getFilter(activeFilter)
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }
  
  return (
    <div className="info-panel">
      {showHeader ? (
        <button
          onClick={toggleExpanded}
          className="panel-toggle"
          aria-expanded={isExpanded}
          aria-controls="panel-content"
        >
          <h3>About Vision Impairments</h3>
          <span className="toggle-icon" aria-hidden="true">
            {isExpanded ? '−' : '+'}
          </span>
        </button>
      ) : (
        <div className="panel-header-popover">
          <h3>About Vision Impairments</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="panel-close-btn"
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      )}
      
      {(showHeader ? isExpanded : true) && (
        <div id="panel-content" className="panel-content">
          {activeFilter !== 'none' && filter ? (
            <div className="active-filter-info">
              <h4>{filter.name}</h4>
              <p className="filter-description">{filter.description}</p>
              <div className="filter-stats">
                <div className="stat">
                  <span className="stat-label">Prevalence:</span>
                  <span className="stat-value">{filter.prevalence}</span>
                </div>
                {filter.severity && (
                  <div className="stat">
                    <span className="stat-label">Severity:</span>
                    <span className="stat-value">{filter.severity}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="general-info">
              <p>
                <strong>Why This Matters:</strong> Millions of people experience the web 
                differently due to vision impairments. By testing your designs through 
                their perspective, you can create more inclusive and accessible experiences.
              </p>
              
              <div className="info-section">
                <h4>Quick Facts</h4>
                <ul>
                  <li><strong>300 million</strong> people worldwide have color vision deficiency</li>
                  <li><strong>1 in 12 males</strong> have some form of colorblindness</li>
                  <li><strong>2.2 billion</strong> people have a vision impairment globally</li>
                  <li><strong>90%</strong> of websites have accessibility barriers</li>
                </ul>
              </div>
              
              <div className="info-section">
                <h4>Design Tips</h4>
                <ul>
                  <li>Use sufficient color contrast (minimum 4.5:1 for text)</li>
                  <li>Don't rely on color alone to convey information</li>
                  <li>Use patterns, icons, and labels alongside colors</li>
                  <li>Test your designs with these filters regularly</li>
                  <li>Make text resizable and maintain readability</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="wcag-info">
            <p className="info-footer">
              Learn more about accessibility at{' '}
              <a 
                href="https://www.w3.org/WAI/WCAG21/quickref/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
              >
                WCAG Guidelines
              </a>
            </p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .info-panel {
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        
        .panel-toggle {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          background: transparent;
          border: none;
          color: var(--text-light);
          cursor: pointer;
          transition: background var(--transition-normal);
        }
        
        .panel-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .panel-toggle h3 {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .panel-header-popover {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: var(--spacing-md);
        }
        
        .panel-header-popover h3 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-light);
        }
        
        .panel-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 1.5rem;
          line-height: 1;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .panel-close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .toggle-icon {
          font-size: 1.5rem;
          line-height: 1;
          font-weight: 300;
        }
        
        .panel-content {
          padding: 0 var(--spacing-md) var(--spacing-md);
          color: var(--text-light);
        }
        
        .active-filter-info {
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-md);
        }
        
        .active-filter-info h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--text-light);
        }
        
        .filter-description {
          margin-bottom: var(--spacing-md);
          line-height: 1.6;
        }
        
        .filter-stats {
          display: flex;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }
        
        .stat {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .stat-label {
          font-size: 0.85rem;
          opacity: 0.8;
        }
        
        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        .general-info p {
          margin-bottom: var(--spacing-md);
          line-height: 1.6;
        }
        
        .info-section {
          margin-bottom: var(--spacing-md);
        }
        
        .info-section h4 {
          margin-bottom: var(--spacing-sm);
          color: var(--text-light);
        }
        
        .info-section ul {
          margin: 0;
          padding-left: var(--spacing-lg);
        }
        
        .info-section li {
          margin-bottom: var(--spacing-xs);
          line-height: 1.6;
        }
        
        .wcag-info {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .info-footer {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        .info-link {
          color: #6EC6FF;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color var(--transition-fast);
        }
        
        .info-link:hover {
          border-bottom-color: #6EC6FF;
        }
        
        .info-link:focus-visible {
          outline: 2px solid #6EC6FF;
          outline-offset: 2px;
        }
        
        @media (max-width: 768px) {
          .filter-stats {
            flex-direction: column;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  )
}

