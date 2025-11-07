'use client'

import React from 'react'
import { getFilter } from '../lib/filters'

/**
 * Filter Info Modal Component
 * 
 * Displays detailed information about a vision impairment filter in a modal overlay.
 * 
 * @param {Object} props
 * @param {string} props.filterId - ID of the filter to display
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function FilterInfoModal({ filterId, isOpen, onClose }) {
  const filter = getFilter(filterId)
  
  if (!isOpen || !filter) return null
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }
  
  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])
  
  return (
    <div 
      className="modal-backdrop" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="modal-close"
          aria-label="Close modal"
        >
          ✕
        </button>
        
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{filter.name}</h2>
          {filter.severity && (
            <span className="modal-severity">{filter.severity}</span>
          )}
        </div>
        
        <div className="modal-body">
          <p className="modal-description">{filter.description}</p>
          
          <div className="modal-stats">
            <div className="modal-stat">
              <span className="stat-label">Prevalence</span>
              <span className="stat-value">{filter.prevalence}</span>
            </div>
            {filter.severity && (
              <div className="modal-stat">
                <span className="stat-label">Severity</span>
                <span className="stat-value">{filter.severity}</span>
              </div>
            )}
          </div>
          
          <div className="modal-info">
            <h3>What this means</h3>
            <p>
              {filter.id === 'protanopia' && 'People with protanopia cannot distinguish between red and green colors. Red appears darker and may be confused with black or dark gray. This affects how they perceive traffic lights, color-coded information, and design elements that rely on red-green differentiation.'}
              {filter.id === 'deuteranopia' && 'Deuteranopia is the most common form of color blindness. People with this condition cannot distinguish between red and green colors, similar to protanopia but caused by different cone cells. Green appears more like beige or gray, making it difficult to see green elements against certain backgrounds.'}
              {filter.id === 'tritanopia' && 'Tritanopia is a rare form of color blindness affecting blue-yellow color vision. People with tritanopia have difficulty distinguishing between blue and green, and between yellow and violet. Blue appears greenish, and yellow may appear pink or light gray.'}
              {filter.id === 'achromatopsia' && 'Achromatopsia is complete color blindness, where people see only in shades of gray. This is a rare condition that significantly impacts daily life, as all color information is lost. Designers should ensure that color is never the only way to convey important information.'}
              {filter.id === 'cataracts' && 'Cataracts cause clouding of the eye\'s lens, resulting in blurred, dimmed vision. Colors appear less vibrant, and there\'s reduced contrast sensitivity. This condition is common in older adults and can make text harder to read, especially with low contrast.'}
              {filter.id === 'lowVision' && 'Low vision refers to significantly reduced visual clarity that cannot be fully corrected with glasses or contact lenses. This includes blurred vision, making it difficult to read small text, see details, or distinguish between similar elements.'}
              {filter.id === 'lowContrast' && 'Low contrast sensitivity makes it difficult to distinguish between similar shades and colors. Text and elements with low contrast ratios become hard to see, which is why WCAG guidelines recommend minimum contrast ratios of 4.5:1 for text.'}
            </p>
          </div>
          
          <div className="modal-tips">
            <h3>Design Tips</h3>
            <ul>
              {filter.id === 'protanopia' || filter.id === 'deuteranopia' || filter.id === 'tritanopia' || filter.id === 'achromatopsia' ? (
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
        </div>
      </div>
      
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .modal-content {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-close {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          color: white;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 10;
        }
        
        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }
        
        .modal-header {
          padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-md);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .modal-title {
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .modal-severity {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: white;
        }
        
        .modal-body {
          padding: var(--spacing-xl);
        }
        
        .modal-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.95);
          margin-bottom: var(--spacing-lg);
        }
        
        .modal-stats {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-md);
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
        
        .modal-stat {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .stat-label {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
        }
        
        .stat-value {
          font-size: 1.1rem;
          color: white;
          font-weight: 600;
        }
        
        .modal-info,
        .modal-tips {
          margin-bottom: var(--spacing-lg);
        }
        
        .modal-info h3,
        .modal-tips h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
          margin: 0 0 var(--spacing-md) 0;
        }
        
        .modal-info p {
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }
        
        .modal-tips ul {
          margin: 0;
          padding-left: var(--spacing-lg);
          list-style: none;
        }
        
        .modal-tips li {
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: var(--spacing-sm);
          position: relative;
          padding-left: var(--spacing-md);
        }
        
        .modal-tips li::before {
          content: '✓';
          position: absolute;
          left: 0;
          color: rgba(110, 198, 255, 1);
          font-weight: 700;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            max-width: 95vw;
            border-radius: 16px;
          }
          
          .modal-title {
            font-size: 1.5rem;
          }
          
          .modal-body {
            padding: var(--spacing-lg);
          }
          
          .modal-stats {
            flex-direction: column;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  )
}

