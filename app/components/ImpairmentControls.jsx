'use client'

import React from 'react'
import { getCategorizedFilters } from '../lib/filters'

/**
 * Impairment Controls Component
 * 
 * Provides toggle buttons for different vision impairment filters.
 * Organized by category (colorblind vs other impairments).
 * 
 * @param {Object} props
 * @param {string} props.activeFilter - Currently active filter ID
 * @param {Function} props.onFilterChange - Callback when filter changes (filterId: string) => void
 * @param {Function} props.onFilterInfo - Callback when filter info is requested (filterId: string) => void
 */
export default function ImpairmentControls({ activeFilter = 'none', onFilterChange, onFilterInfo }) {
  const filters = getCategorizedFilters()
  
  const handleFilterClick = (filterId) => {
    // Regular click - toggle filter
    const newFilter = activeFilter === filterId ? 'none' : filterId
    onFilterChange(newFilter)
  }
  
  const handleInfoClick = (filterId, e) => {
    e.stopPropagation()
    e.preventDefault()
    if (onFilterInfo) {
      onFilterInfo(filterId)
    }
  }
  
  return (
    <div className="impairment-controls">
      <div className="controls-header">
        <h3>Vision Impairment Filters</h3>
        <p className="controls-description">
          Click a filter to see how people with that condition experience websites
        </p>
      </div>
      
      <div className="filter-section">
        <h4 className="section-title">Color Vision Deficiency</h4>
        <div className="filter-grid">
          {filters.colorblind.map((filter) => (
            <div key={filter.id} className="filter-item-wrapper">
              <button
                onClick={() => handleFilterClick(filter.id)}
                className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                aria-pressed={activeFilter === filter.id}
                title={filter.description}
              >
                <span className="filter-name">{filter.name}</span>
                <span className="filter-prevalence">{filter.prevalence}</span>
              </button>
              {onFilterInfo && (
                <button
                  onClick={(e) => handleInfoClick(filter.id, e)}
                  className="filter-info-btn-external"
                  aria-label={`Learn more about ${filter.name}`}
                  title="Learn more"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M8 6V8M8 10H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="filter-section">
        <h4 className="section-title">Other Vision Impairments</h4>
        <div className="filter-grid">
          {filters.other.map((filter) => (
            <div key={filter.id} className="filter-item-wrapper">
              <button
                onClick={() => handleFilterClick(filter.id)}
                className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
                aria-pressed={activeFilter === filter.id}
                title={filter.description}
              >
                <span className="filter-name">{filter.name}</span>
                <span className="filter-prevalence">{filter.prevalence}</span>
              </button>
              {onFilterInfo && (
                <button
                  onClick={(e) => handleInfoClick(filter.id, e)}
                  className="filter-info-btn-external"
                  aria-label={`Learn more about ${filter.name}`}
                  title="Learn more"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M8 6V8M8 10H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {activeFilter !== 'none' && (
        <button
          onClick={() => onFilterChange('none')}
          className="reset-btn"
          aria-label="Clear active filter"
        >
          Clear Filter
        </button>
      )}
      
      <style jsx>{`
        .impairment-controls {
          width: 100%;
        }
        
        .controls-header {
          margin-bottom: var(--spacing-lg);
        }
        
        .controls-header h3 {
          margin-bottom: var(--spacing-xs);
        }
        
        .controls-description {
          font-size: 0.9rem;
          opacity: 0.9;
          margin: 0;
        }
        
        .filter-section {
          margin-bottom: var(--spacing-lg);
        }
        
        .section-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
          color: rgba(255, 255, 255, 0.95);
        }
        
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--spacing-sm);
        }
        
        .filter-item-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .filter-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: var(--spacing-md);
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-light);
          text-align: left;
          transition: all var(--transition-normal);
          cursor: pointer;
        }
        
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
        }
        
        .filter-btn:active {
          transform: translateY(-1px);
        }
        
        .filter-btn.active {
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.3) 0%, rgba(147, 112, 219, 0.3) 100%);
          border-color: rgba(110, 198, 255, 0.7);
          box-shadow: 0 0 30px rgba(110, 198, 255, 0.5), inset 0 0 20px rgba(110, 198, 255, 0.2);
          transform: scale(1.02);
        }
        
        .filter-name {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: var(--spacing-xs);
        }
        
        .filter-prevalence {
          font-size: 0.85rem;
          opacity: 0.8;
        }
        
        .filter-info-btn-external {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(110, 198, 255, 0.15);
          border: 1px solid rgba(110, 198, 255, 0.3);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          color: rgba(110, 198, 255, 0.9);
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
        }
        
        .filter-item-wrapper:hover .filter-info-btn-external {
          opacity: 1;
        }
        
        .filter-info-btn-external:hover {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.5);
          color: rgba(110, 198, 255, 1);
          transform: scale(1.1);
        }
        
        .filter-info-btn-external svg {
          width: 12px;
          height: 12px;
        }
        
        .reset-btn {
          width: 100%;
          padding: var(--spacing-md);
          background: rgba(255, 107, 107, 0.2);
          border: 2px solid rgba(255, 107, 107, 0.4);
          border-radius: var(--radius-sm);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-normal);
        }
        
        .reset-btn:hover {
          background: rgba(255, 107, 107, 0.3);
          border-color: rgba(255, 107, 107, 0.6);
        }
        
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 480px) {
          .filter-btn {
            padding: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  )
}

