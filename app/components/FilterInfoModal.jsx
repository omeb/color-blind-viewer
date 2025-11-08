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
  const [popoverStyle, setPopoverStyle] = React.useState({ 
    opacity: 0,
    visibility: 'hidden'
  })
  const [isPositioned, setIsPositioned] = React.useState(false)
  
  React.useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false)
      setPopoverStyle({ opacity: 0, visibility: 'hidden' })
      return
    }
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    // Calculate position once, correctly, before showing
    const calculatePosition = () => {
      if (typeof window === 'undefined') return
      
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const minMargin = 20
      const maxHeight = viewportHeight - minMargin * 2
      
      if (position) {
        // Positioned relative to a button
        let maxWidth = 500 // default for tablets
        if (viewportWidth >= 1440) {
          maxWidth = 700
        } else if (viewportWidth >= 1024) {
          maxWidth = 600
        } else if (viewportWidth <= 768) {
          maxWidth = viewportWidth - 40
        }
        const popoverWidth = Math.min(maxWidth, viewportWidth - 40)
        
        let x = position.x
        let y = position.y
        let arrowSide = 'left'
        
        // Check if popover would overflow right edge
        if (x + popoverWidth / 2 > viewportWidth - minMargin) {
          x = position.x - popoverWidth - 24
          arrowSide = 'right'
        }
        
        // Ensure x doesn't go off left edge
        if (x < minMargin) {
          x = minMargin
        }
        
        // Measure actual modal height - use a reasonable estimate based on content
        // We'll use scrollHeight if available, otherwise estimate
        let actualHeight = 500 // Conservative estimate
        if (popoverRef.current) {
          // Temporarily set max dimensions to measure natural height
          const wasVisible = popoverRef.current.style.visibility !== 'hidden'
          const originalMaxHeight = popoverRef.current.style.maxHeight
          const originalMaxWidth = popoverRef.current.style.maxWidth
          
          // Set dimensions for measurement
          popoverRef.current.style.maxHeight = `${maxHeight}px`
          popoverRef.current.style.maxWidth = `${popoverWidth}px`
          popoverRef.current.style.visibility = 'hidden'
          
          // Force layout calculation
          const height = popoverRef.current.scrollHeight
          actualHeight = Math.min(height, maxHeight)
          
          // Restore
          popoverRef.current.style.maxHeight = originalMaxHeight
          popoverRef.current.style.maxWidth = originalMaxWidth
          popoverRef.current.style.visibility = wasVisible ? '' : 'hidden'
        }
        
        // Calculate final position with actual height
        const topEdgeWithCenter = y - actualHeight / 2
        const bottomEdgeWithCenter = y + actualHeight / 2
        
        let finalY = y
        let transform = 'translateY(-50%)'
        
        // If using center alignment would cut off top, switch to top alignment
        if (topEdgeWithCenter < minMargin) {
          finalY = minMargin
          transform = 'none'
        }
        // If using center alignment would cut off bottom, switch to bottom alignment
        else if (bottomEdgeWithCenter > viewportHeight - minMargin) {
          finalY = viewportHeight - minMargin
          transform = 'translateY(-100%)'
        }
        
        const finalStyle = {
          left: `${x}px`,
          top: `${finalY}px`,
          transform: transform,
          maxHeight: `${maxHeight}px`,
          maxWidth: `${popoverWidth}px`,
          opacity: 1,
          visibility: 'visible'
        }
        
        // Store arrow side before setting style
        if (popoverRef.current) {
          popoverRef.current.setAttribute('data-arrow-side', arrowSide)
        }
        
        // Set final position and show in one update
        setPopoverStyle(finalStyle)
        setIsPositioned(true)
      } else {
        // Centered positioning
        const topMargin = viewportWidth > 768 ? 100 : 80
        setPopoverStyle({
          left: '50%',
          top: `${topMargin}px`,
          transform: 'translateX(-50%)',
          maxHeight: `calc(100vh - ${topMargin * 2}px)`,
          opacity: 1,
          visibility: 'visible'
        })
        setIsPositioned(true)
      }
    }
    
    // Wait for DOM to be ready, then calculate and show
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        calculatePosition()
      })
    })
    
    // Also update on window resize
    const handleResize = () => {
      if (isPositioned) {
        calculatePosition()
      }
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, onClose, position, isPositioned])
  
  if (!isOpen || !filter) return null
  
  return (
      <div 
        className="filter-info-popover-backdrop"
        onClick={(e) => {
          // Close if clicking on backdrop (not on popover or close button)
          const target = e.target
          const isCloseButton = target.closest('.popover-close')
          if (!isCloseButton && (target === e.currentTarget || !popoverRef.current?.contains(target))) {
            onClose()
          }
        }}
        onMouseDown={(e) => {
          // Prevent backdrop from capturing mousedown events
          const target = e.target
          const isCloseButton = target.closest('.popover-close')
          if (!isCloseButton && target !== e.currentTarget && popoverRef.current?.contains(target)) {
            e.stopPropagation()
          }
        }}
        onTouchStart={(e) => {
          // Prevent backdrop from capturing touch events
          const target = e.target
          const isCloseButton = target.closest('.popover-close')
          if (!isCloseButton && target !== e.currentTarget && popoverRef.current?.contains(target)) {
            e.stopPropagation()
          }
        }}
      >
      <div 
        ref={popoverRef}
        className="filter-info-popover" 
        style={popoverStyle}
        data-positioned={isPositioned ? "true" : "false"}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
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
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onClose()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
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
          pointer-events: auto;
          cursor: default;
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
          position: absolute;
          min-height: 200px;
          transition: opacity 0.15s ease-out;
        }
        
        .filter-info-popover[data-positioned="true"] {
          animation: popoverSlideIn 0.2s ease-out;
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
          position: sticky;
          top: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 10;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
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
          padding: 8px;
          border-radius: 8px;
          transition: all var(--transition-fast);
          font-size: 1.2rem;
          line-height: 1;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 100; /* Ensure button is above other elements */
          pointer-events: auto; /* Ensure button is clickable */
        }
        
        .popover-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .popover-close:active {
          background: rgba(255, 255, 255, 0.15);
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
        
        /* Larger screens - improved readability */
        @media (min-width: 1024px) {
          .filter-info-popover {
            max-width: 600px;
          }
          
          .popover-header {
            padding: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-body {
            padding: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-title {
            font-size: 1.75rem;
          }
          
          .popover-severity {
            font-size: 0.875rem;
            padding: 4px 12px;
          }
          
          .popover-close {
            font-size: 1.5rem;
            width: 44px;
            height: 44px;
            padding: 10px;
          }
          
          .popover-description {
            font-size: 1.125rem;
            line-height: 1.7;
            margin-bottom: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-stats {
            padding: calc(var(--spacing-sm) * 1.25);
            margin-bottom: calc(var(--spacing-md) * 1.25);
          }
          
          .stat-label {
            font-size: 0.875rem;
          }
          
          .stat-value {
            font-size: 1.125rem;
          }
          
          .popover-info,
          .popover-tips {
            margin-bottom: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-info h4,
          .popover-tips h4 {
            font-size: 1.25rem;
            margin-bottom: var(--spacing-md);
          }
          
          .popover-info p {
            font-size: 1rem;
            line-height: 1.7;
          }
          
          .popover-tips ul {
            padding-left: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-tips li {
            font-size: 1rem;
            line-height: 1.7;
            margin-bottom: var(--spacing-sm);
            padding-left: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-actions {
            padding-top: calc(var(--spacing-md) * 1.25);
          }
          
          .popover-apply-btn {
            font-size: 1rem;
            padding: calc(var(--spacing-sm) * 1.25) calc(var(--spacing-md) * 1.5);
          }
        }
        
        /* Extra large screens - even more spacious */
        @media (min-width: 1440px) {
          .filter-info-popover {
            max-width: 700px;
          }
          
          .popover-header {
            padding: calc(var(--spacing-md) * 1.5);
          }
          
          .popover-body {
            padding: calc(var(--spacing-md) * 1.5);
          }
          
          .popover-title {
            font-size: 2rem;
          }
          
          .popover-description {
            font-size: 1.25rem;
            margin-bottom: calc(var(--spacing-md) * 1.5);
          }
          
          .popover-stats {
            padding: calc(var(--spacing-sm) * 1.5);
            margin-bottom: calc(var(--spacing-md) * 1.5);
          }
          
          .stat-value {
            font-size: 1.25rem;
          }
          
          .popover-info h4,
          .popover-tips h4 {
            font-size: 1.375rem;
          }
          
          .popover-info p {
            font-size: 1.125rem;
          }
          
          .popover-tips li {
            font-size: 1.125rem;
          }
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

