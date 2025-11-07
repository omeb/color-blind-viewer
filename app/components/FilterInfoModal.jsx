'use client'

import React from 'react'
import { getFilter } from '../lib/filters'

/**
 * Filter Info Popover Component
 * 
 * Displays detailed information about a vision impairment filter in a popover.
 * 
 * @param {Object} props
 * @param {string} props.filterId - ID of the filter to display
 * @param {boolean} props.isOpen - Whether the popover is open
 * @param {Function} props.onClose - Callback to close the popover
 * @param {Function} props.onApplyFilter - Optional callback to apply the filter
 * @param {Object} props.position - Optional position {x, y} for the popover
 */
export default function FilterInfoPopover({ filterId, isOpen, onClose, onApplyFilter, position }) {
  const filter = getFilter(filterId)
  const popoverRef = React.useRef(null)
  const [popoverStyle, setPopoverStyle] = React.useState({})
  
  React.useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    // Calculate position with viewport constraints
    if (position && typeof window !== 'undefined') {
      const maxWidth = window.innerWidth > 768 ? 500 : window.innerWidth - 20
      const popoverWidth = Math.min(maxWidth, window.innerWidth - 40)
      
      // Position to the right of the button, but ensure it fits on screen
      let x = position.x
      let y = position.y
      let arrowSide = 'left' // Arrow on left side (popover on right)
      
      // If popover would overflow right edge, position to the left instead
      if (x + popoverWidth / 2 > window.innerWidth - 20) {
        x = position.x - popoverWidth - 24 // Position to the left with arrow space
        arrowSide = 'right' // Arrow on right side (popover on left)
      }
      
      // Ensure popover doesn't overflow top or bottom
      const maxHeight = window.innerHeight - 40
      const estimatedHeight = Math.min(600, maxHeight)
      
      if (y - estimatedHeight / 2 < 20) {
        y = estimatedHeight / 2 + 20
      } else if (y + estimatedHeight / 2 > window.innerHeight - 20) {
        y = window.innerHeight - estimatedHeight / 2 - 20
      }
      
      setPopoverStyle({
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translateY(-50%)',
        maxHeight: `${maxHeight}px`
      })
      
      // Store arrow side in a data attribute for CSS
      if (popoverRef.current) {
        popoverRef.current.setAttribute('data-arrow-side', arrowSide)
      }
    } else {
      setPopoverStyle({
        left: '50%',
        top: window.innerWidth > 768 ? '100px' : '80px',
        transform: 'translateX(-50%)',
        maxHeight: 'calc(100vh - 120px)'
      })
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, position])
  
  if (!isOpen || !filter) return null
  
  return (
    <div 
      className="filter-info-popover-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        ref={popoverRef}
        className="filter-info-popover" 
        style={popoverStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popover-title"
      >
        {/* Arrow pointing to the button */}
        {position && typeof window !== 'undefined' && (() => {
          const arrowSide = position.x + 250 > window.innerWidth - 20 ? 'right' : 'left'
          return (
            <div className={`popover-arrow popover-arrow-${arrowSide}`} />
          )
        })()}
        <div className="popover-header">
          <div className="popover-title-section">
            <h3 id="popover-title" className="popover-title">{filter.name}</h3>
            {filter.severity && (
              <span className="popover-severity">{filter.severity}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="popover-close"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="popover-body">
          <p className="popover-description">{filter.description}</p>
          
          <div className="popover-stats">
            <div className="popover-stat">
              <span className="stat-label">Prevalence</span>
              <span className="stat-value">{filter.prevalence}</span>
            </div>
            {filter.severity && (
              <div className="popover-stat">
                <span className="stat-label">Severity</span>
                <span className="stat-value">{filter.severity}</span>
              </div>
            )}
          </div>
          
          <div className="popover-info">
            <h4>What this means</h4>
            <p>
              {filter.id === 'protanopia' && 'People with protanopia cannot distinguish between red and green colors. Red appears darker and may be confused with black or dark gray. This affects how they perceive traffic lights, color-coded information, and design elements that rely on red-green differentiation.'}
              {filter.id === 'deuteranopia' && 'Deuteranopia is the most common form of color blindness. People with this condition cannot distinguish between red and green colors, similar to protanopia but caused by different cone cells. Green appears more like beige or gray, making it difficult to see green elements against certain backgrounds.'}
              {filter.id === 'protanomaly' && 'Protanomaly is a milder form of red colorblindness. People with this condition have reduced sensitivity to red light, making it harder to distinguish between red and green, though not as severely as protanopia.'}
              {filter.id === 'deuteranomaly' && 'Deuteranomaly is the most common color vision deficiency. People with this condition have reduced sensitivity to green light, making it difficult to distinguish between red and green colors, though the effect is milder than deuteranopia.'}
              {filter.id === 'tritanopia' && 'Tritanopia is a rare form of color blindness affecting blue-yellow color vision. People with tritanopia have difficulty distinguishing between blue and green, and between yellow and violet. Blue appears greenish, and yellow may appear pink or light gray.'}
              {filter.id === 'achromatopsia' && 'Achromatopsia is complete color blindness, where people see only in shades of gray. This is a rare condition that significantly impacts daily life, as all color information is lost. Designers should ensure that color is never the only way to convey important information.'}
              {filter.id === 'cataracts' && 'Cataracts cause clouding of the eye\'s lens, resulting in blurred, dimmed vision. Colors appear less vibrant, and there\'s reduced contrast sensitivity. This condition is common in older adults and can make text harder to read, especially with low contrast.'}
              {filter.id === 'lowVision' && 'Low vision refers to significantly reduced visual clarity that cannot be fully corrected with glasses or contact lenses. This includes blurred vision, making it difficult to read small text, see details, or distinguish between similar elements.'}
              {filter.id === 'lowContrast' && 'Low contrast sensitivity makes it difficult to distinguish between similar shades and colors. Text and elements with low contrast ratios become hard to see, which is why WCAG guidelines recommend minimum contrast ratios of 4.5:1 for text.'}
              {filter.id === 'glaucoma' && 'Glaucoma causes progressive vision loss, typically starting with peripheral vision. People with glaucoma experience tunnel vision, making it difficult to see content at the edges of the screen. Important information should be placed centrally.'}
              {filter.id === 'macularDegeneration' && 'Macular degeneration affects central vision, causing blurred or dark spots in the center of the visual field. People with this condition may have difficulty reading text and seeing fine details, especially in the center of their vision.'}
              {filter.id === 'diabeticRetinopathy' && 'Diabetic retinopathy can cause blurred vision, floaters, and reduced contrast sensitivity. Fluctuating vision and difficulty seeing in low light are common. High contrast and clear typography are essential.'}
            </p>
          </div>
          
          <div className="popover-tips">
            <h4>Design Tips</h4>
            <ul>
              {filter.id === 'protanopia' || filter.id === 'deuteranopia' || filter.id === 'protanomaly' || filter.id === 'deuteranomaly' || filter.id === 'tritanopia' || filter.id === 'achromatopsia' ? (
                <>
                  <li>Never rely on color alone to convey information</li>
                  <li>Use icons, patterns, or labels alongside colors</li>
                  <li>Ensure sufficient contrast (minimum 4.5:1 for text)</li>
                  <li>Test your designs with colorblind simulators</li>
                  <li>Provide alternative ways to identify important elements</li>
                </>
              ) : (
                <>
                  <li>Use high contrast ratios (minimum 4.5:1 for text)</li>
                  <li>Make text resizable without breaking layout</li>
                  <li>Avoid small font sizes</li>
                  <li>Use clear, bold typography</li>
                  <li>Provide sufficient spacing between elements</li>
                </>
              )}
            </ul>
          </div>
          
          {onApplyFilter && (
            <div className="popover-actions">
              <button
                onClick={() => {
                  onApplyFilter(filter.id)
                  onClose()
                }}
                className="popover-apply-btn"
              >
                Apply This Filter
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .filter-info-popover-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 2000;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          pointer-events: none;
        }
        
        .filter-info-popover {
          pointer-events: auto;
          background: rgba(0, 0, 0, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          max-width: 500px;
          width: 90vw;
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: popoverSlideIn 0.2s ease-out;
          position: absolute;
        }
        
        .popover-arrow {
          position: absolute;
          width: 0;
          height: 0;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }
        
        .popover-arrow-left {
          left: -8px;
          border-style: solid;
          border-width: 8px 8px 8px 0;
          border-color: transparent rgba(0, 0, 0, 0.95) transparent transparent;
          filter: drop-shadow(-2px 0 2px rgba(0, 0, 0, 0.3));
        }
        
        .popover-arrow-left::after {
          content: '';
          position: absolute;
          left: -1px;
          top: -8px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 8px 8px 8px 0;
          border-color: transparent rgba(255, 255, 255, 0.2) transparent transparent;
        }
        
        .popover-arrow-right {
          right: -8px;
          border-style: solid;
          border-width: 8px 0 8px 8px;
          border-color: transparent transparent transparent rgba(0, 0, 0, 0.95);
          filter: drop-shadow(2px 0 2px rgba(0, 0, 0, 0.3));
        }
        
        .popover-arrow-right::after {
          content: '';
          position: absolute;
          right: -1px;
          top: -8px;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 8px 0 8px 8px;
          border-color: transparent transparent transparent rgba(255, 255, 255, 0.2);
        }
        
        @keyframes popoverSlideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .popover-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--spacing-md);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .popover-title-section {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .popover-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        
        .popover-severity {
          display: inline-block;
          padding: 2px 8px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          width: fit-content;
        }
        
        .popover-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all var(--transition-fast);
          font-size: 1rem;
          line-height: 1;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .popover-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .popover-body {
          padding: var(--spacing-md);
        }
        
        .popover-description {
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: var(--spacing-md);
        }
        
        .popover-stats {
          display: flex;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
          padding: var(--spacing-sm);
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }
        
        .popover-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }
        
        .stat-value {
          font-size: 0.9rem;
          color: white;
          font-weight: 600;
        }
        
        .popover-info,
        .popover-tips {
          margin-bottom: var(--spacing-md);
        }
        
        .popover-info h4,
        .popover-tips h4 {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .popover-info p {
          font-size: 0.85rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }
        
        .popover-tips ul {
          margin: 0;
          padding-left: var(--spacing-md);
          list-style: none;
        }
        
        .popover-tips li {
          font-size: 0.85rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: var(--spacing-xs);
          position: relative;
          padding-left: var(--spacing-md);
        }
        
        .popover-tips li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: rgba(110, 198, 255, 1);
          font-weight: 700;
        }
        
        .popover-actions {
          padding-top: var(--spacing-md);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: center;
        }
        
        .popover-apply-btn {
          background: rgba(110, 198, 255, 0.2);
          border: 1px solid rgba(110, 198, 255, 0.4);
          border-radius: 8px;
          color: white;
          padding: var(--spacing-sm) var(--spacing-md);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .popover-apply-btn:hover {
          background: rgba(110, 198, 255, 0.3);
          border-color: rgba(110, 198, 255, 0.6);
        }
        
        @media (max-width: 768px) {
          .filter-info-popover {
            max-width: 95vw;
            max-height: calc(100vh - 80px);
          }
          
          .popover-title {
            font-size: 1.1rem;
          }
          
          .popover-stats {
            flex-direction: column;
            gap: var(--spacing-sm);
          }
        }
      `}</style>
    </div>
  )
}

