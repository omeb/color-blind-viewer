'use client'

import React from 'react'
import UrlInput from './components/UrlInput'
import WebsiteViewer from './components/WebsiteViewer'
import ImpairmentControls from './components/ImpairmentControls'
import InfoPanel from './components/InfoPanel'
import { generateSVGFilters } from './lib/filters'

export default function Home() {
  const [targetUrl, setTargetUrl] = React.useState('')
  const [loadedUrl, setLoadedUrl] = React.useState('')
  const [activeFilter, setActiveFilter] = React.useState('none')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  
  const handleUrlSubmit = async (url) => {
    setLoading(true)
    setError(null)
    setTargetUrl(url)
    
    // Simulate a brief delay to show loading state
    setTimeout(() => {
      setLoadedUrl(url)
      setLoading(false)
    }, 500)
  }
  
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId)
  }
  
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* SVG filters for colorblindness simulation */}
      <div dangerouslySetInnerHTML={{ __html: generateSVGFilters() }} />
      
      <main id="main-content" className="app-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="glass-card-lg hero-content">
            <h1>Colorblind Viewer</h1>
            <p className="hero-subtitle">
              Experience the web through the eyes of people with vision impairments.
              Test your designs for accessibility.
            </p>
            
            <div className="url-input-section">
              <UrlInput onSubmit={handleUrlSubmit} loading={loading} />
            </div>
          </div>
        </section>
        
        {/* Main Content */}
        <div className="main-content">
          <div className="content-grid">
            {/* Left Column - Controls and Info */}
            <aside className="sidebar glass-card">
              <ImpairmentControls
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
              />
              
              <div className="mt-lg">
                <InfoPanel activeFilter={activeFilter} />
              </div>
            </aside>
            
            {/* Right Column - Website Viewer */}
            <section className="viewer-section">
              <div className="glass-card">
                <div className="viewer-header">
                  <h2>Preview</h2>
                  {activeFilter !== 'none' && (
                    <span className="active-filter-badge">
                      Filter: {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
                    </span>
                  )}
                </div>
                <WebsiteViewer
                  url={loadedUrl}
                  activeFilter={activeFilter}
                  loading={loading}
                  error={error}
                />
              </div>
            </section>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="footer">
          <div className="glass-card footer-content">
            <p>
              Built to promote web accessibility and inclusive design.{' '}
              <a 
                href="https://github.com/omeb/color-blind-viewer" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                View on GitHub
              </a>
            </p>
            <p className="footer-note">
              Note: Some websites may block iframe embedding for security reasons.
            </p>
          </div>
        </footer>
      </main>
      
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          padding: var(--spacing-lg);
        }
        
        .hero-section {
          margin-bottom: var(--spacing-xl);
        }
        
        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        
        .hero-subtitle {
          font-size: 1.15rem;
          margin-bottom: var(--spacing-xl);
          opacity: 0.95;
        }
        
        .url-input-section {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .main-content {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .content-grid {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: var(--spacing-lg);
        }
        
        .sidebar {
          position: sticky;
          top: var(--spacing-lg);
          height: fit-content;
          max-height: calc(100vh - 2 * var(--spacing-lg));
          overflow-y: auto;
        }
        
        .viewer-section {
          min-height: 600px;
        }
        
        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }
        
        .viewer-header h2 {
          margin: 0;
        }
        
        .active-filter-badge {
          padding: var(--spacing-xs) var(--spacing-md);
          background: rgba(110, 198, 255, 0.2);
          border: 1px solid rgba(110, 198, 255, 0.4);
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-light);
        }
        
        .footer {
          margin-top: var(--spacing-xl);
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .footer-content {
          text-align: center;
          padding: var(--spacing-lg);
        }
        
        .footer-content p {
          margin: var(--spacing-xs) 0;
        }
        
        .footer-link {
          color: #6EC6FF;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color var(--transition-fast);
        }
        
        .footer-link:hover {
          border-bottom-color: #6EC6FF;
        }
        
        .footer-note {
          font-size: 0.85rem;
          opacity: 0.8;
        }
        
        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 300px 1fr;
          }
        }
        
        @media (max-width: 968px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
          
          .sidebar {
            position: static;
            max-height: none;
          }
        }
        
        @media (max-width: 768px) {
          .app-container {
            padding: var(--spacing-md);
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .hero-subtitle {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  )
}

