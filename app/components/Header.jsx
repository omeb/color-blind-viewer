'use client'

import React from 'react'

/**
 * Header Component
 * 
 * Displays the main site header with title and security note.
 */
export default function Header() {
  return (
    <header className="site-header">
      <div className="glass-card header-content">
        <h1 className="header-title">Making the web accessible for everyone</h1>
        <p className="header-note">
          Some sites may restrict embedding for security. Try different URLs if needed.
        </p>
      </div>
      
      <style jsx>{`
        .site-header {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto var(--spacing-lg) auto;
        }
        
        .header-content {
          padding: var(--spacing-lg) var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          text-align: center;
        }
        
        .header-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
          letter-spacing: -0.01em;
        }
        
        .header-note {
          font-size: 0.8rem;
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }
      `}</style>
    </header>
  )
}

