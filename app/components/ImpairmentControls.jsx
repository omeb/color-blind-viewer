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
      const rect = e.currentTarget.getBoundingClientRect()
      onFilterInfo(filterId, {
        x: rect.right + 12, // Position to the right of the button
        y: rect.top + rect.height / 2 // Center vertically with the button
      })
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
                  className="filter-info-btn"
                  aria-label={`Learn more about ${filter.name}`}
                  title="Learn more"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M7 5V7M7 9H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                  className="filter-info-btn"
                  aria-label={`Learn more about ${filter.name}`}
                  title="Learn more"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <path d="M7 5V7M7 9H7.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <style jsx>{`
        .impairment-controls {
          width: 100%;
          display: flex;
          flex-direction: column;
          flex: 1;
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
          grid-template-columns: repeat(2, 1fr);
          gap: var(--spacing-sm);
        }
        
        .filter-item-wrapper {
          position: relative;
        }
        
        .filter-btn {
          width: 100%;
          height: 70px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: var(--spacing-sm);
          background: var(--glass-bg);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 2px solid var(--glass-border);
          border-radius: var(--radius-sm);
          color: var(--text-light);
          text-align: left;
          transition: all var(--transition-normal);
          cursor: pointer;
          box-sizing: border-box;
        }
        
        .filter-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
        }
        
        .filter-btn:active {
          transform: scale(0.98);
        }
        
        .filter-btn.active {
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.3) 0%, rgba(147, 112, 219, 0.3) 100%);
          border-color: rgba(110, 198, 255, 0.7);
          box-shadow: 0 0 30px rgba(110, 198, 255, 0.5), inset 0 0 20px rgba(110, 198, 255, 0.2);
          transform: scale(1.02);
        }
        
        .filter-name {
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 4px;
          padding-right: 0;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
        
        .filter-item-wrapper:has(.filter-info-btn) .filter-name {
          padding-right: calc(var(--spacing-sm) + 24px + 8px);
        }
        
        .filter-prevalence {
          font-size: 0.75rem;
          opacity: 0.8;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .filter-info-btn {
          position: absolute;
          top: 50%;
          right: var(--spacing-sm);
          transform: translateY(-50%);
          background: rgba(110, 198, 255, 0.15);
          border: 1.5px solid rgba(110, 198, 255, 0.4);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          color: rgba(110, 198, 255, 0.9);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          z-index: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
          pointer-events: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .filter-item-wrapper:hover .filter-info-btn {
          opacity: 1;
          pointer-events: auto;
        }
        
        .filter-info-btn:hover {
          background: rgba(110, 198, 255, 0.25);
          border-color: rgba(110, 198, 255, 0.6);
          color: rgba(110, 198, 255, 1);
          transform: translateY(-50%) scale(1.15);
          box-shadow: 0 2px 12px rgba(110, 198, 255, 0.35);
        }
        
        .filter-info-btn:active {
          transform: translateY(-50%) scale(1.05);
        }
        
        .filter-info-btn svg {
          width: 13px;
          height: 13px;
        }
        
        @media (max-width: 768px) {
          .filter-grid {
            grid-template-columns: 1fr;
          }
          
          .filter-info-btn {
            opacity: 1;
            pointer-events: auto;
            width: 28px;
            height: 28px;
            background: rgba(110, 198, 255, 0.2);
            border: 2px solid rgba(110, 198, 255, 0.5);
            color: rgba(110, 198, 255, 1);
            top: 50%;
            right: var(--spacing-xs);
            transform: translateY(-50%);
          }
          
          .filter-item-wrapper:has(.filter-info-btn) .filter-name {
            padding-right: calc(var(--spacing-xs) + 28px + 8px);
          }
          
          .filter-info-btn svg {
            width: 15px;
            height: 15px;
          }
          
          .filter-info-btn:hover {
            transform: translateY(-50%) scale(1.15);
          }
          
          .filter-info-btn:active {
            background: rgba(110, 198, 255, 0.3);
            border-color: rgba(110, 198, 255, 0.7);
            transform: translateY(-50%) scale(0.95);
          }
        }
        
        @media (max-width: 480px) {
          .filter-btn {
            padding: var(--spacing-xs);
          }
          
          .filter-name {
            font-size: 0.85rem;
          }
          
          .filter-prevalence {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  )
}

