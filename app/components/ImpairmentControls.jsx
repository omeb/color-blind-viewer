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
  
  const handleFilterClick = (filterId, e) => {
    // If right-click or Ctrl/Cmd+click, show info modal
    if (e.ctrlKey || e.metaKey || e.button === 2) {
      e.preventDefault()
      if (onFilterInfo) {
        onFilterInfo(filterId)
      }
      return
    }
    
    // Regular click - toggle filter
    const newFilter = activeFilter === filterId ? 'none' : filterId
    onFilterChange(newFilter)
  }
  
  const handleInfoClick = (filterId, e) => {
    e.stopPropagation()
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
            <button
              key={filter.id}
              onClick={(e) => handleFilterClick(filter.id, e)}
              onContextMenu={(e) => {
                e.preventDefault()
                handleInfoClick(filter.id, e)
              }}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              aria-pressed={activeFilter === filter.id}
              title={`${filter.description} (Click for info)`}
            >
              <span className="filter-name">{filter.name}</span>
              <span className="filter-prevalence">{filter.prevalence}</span>
              <button
                onClick={(e) => handleInfoClick(filter.id, e)}
                className="filter-info-btn"
                aria-label={`Learn more about ${filter.name}`}
                title="Learn more"
              >
                ℹ️
              </button>
            </button>
          ))}
        </div>
      </div>
      
      <div className="filter-section">
        <h4 className="section-title">Other Vision Impairments</h4>
        <div className="filter-grid">
          {filters.other.map((filter) => (
            <button
              key={filter.id}
              onClick={(e) => handleFilterClick(filter.id, e)}
              onContextMenu={(e) => {
                e.preventDefault()
                handleInfoClick(filter.id, e)
              }}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              aria-pressed={activeFilter === filter.id}
              title={`${filter.description} (Click for info)`}
            >
              <span className="filter-name">{filter.name}</span>
              <span className="filter-prevalence">{filter.prevalence}</span>
              <button
                onClick={(e) => handleInfoClick(filter.id, e)}
                className="filter-info-btn"
                aria-label={`Learn more about ${filter.name}`}
                title="Learn more"
              >
                ℹ️
              </button>
            </button>
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
        
        .filter-btn {
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
        
        .filter-info-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(110, 198, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 0.7rem;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        
        .filter-btn:hover .filter-info-btn {
          opacity: 1;
        }
        
        .filter-info-btn:hover {
          background: rgba(110, 198, 255, 0.4);
          transform: scale(1.1);
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

