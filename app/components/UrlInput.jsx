'use client'

import React from 'react'

/**
 * URL Input Component
 * 
 * Allows users to enter a website URL to view with vision impairment filters.
 * Validates URL format before submission.
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Callback when URL is submitted (url: string) => void
 * @param {boolean} props.loading - Whether a request is in progress
 * @param {string} props.value - External value to set (controlled component)
 * @param {Function} props.onValueChange - Callback when value changes externally
 */
export default function UrlInput({ onSubmit, loading = false, value: externalValue, onValueChange }) {
  const [url, setUrl] = React.useState('')
  const [error, setError] = React.useState('')
  
  // Sync with external value if provided
  React.useEffect(() => {
    if (externalValue !== undefined && externalValue !== url) {
      setUrl(externalValue)
    }
  }, [externalValue])
  
  const formatUrl = (inputUrl) => {
    let formatted = inputUrl.trim()
    
    // Remove spaces
    formatted = formatted.replace(/\s+/g, '')
    
    // Fix common typos: replace -com, -org, -net with .com, .org, .net
    formatted = formatted.replace(/-(com|org|net|io|co|edu|gov)$/i, '.$1')
    
    // Extract protocol if present
    let protocol = ''
    let rest = formatted
    
    if (formatted.startsWith('http://')) {
      protocol = 'http://'
      rest = formatted.slice(7)
    } else if (formatted.startsWith('https://')) {
      protocol = 'https://'
      rest = formatted.slice(8)
    }
    
    // Extract domain and path/query
    const pathMatch = rest.match(/^([^/?#]+)(.*)$/)
    const domain = pathMatch ? pathMatch[1] : rest
    const path = pathMatch ? pathMatch[2] : ''
    
    // Check if domain has a subdomain
    const domainParts = domain.split('.')
    
    // Common two-part TLDs (country code + top-level domain)
    const twoPartTlds = ['co.il', 'co.uk', 'com.au', 'com.br', 'com.mx', 'com.ar', 'co.za', 'co.nz', 'co.jp', 'com.sg', 'com.hk', 'com.tw', 'com.tr', 'com.pl', 'com.ro', 'com.gr', 'com.es', 'com.it', 'com.fr', 'com.de', 'com.nl', 'com.be', 'com.se', 'com.no', 'com.dk', 'com.fi', 'com.pt', 'com.cz', 'com.hu', 'com.ua', 'com.ru', 'com.cn', 'com.in', 'com.my', 'com.ph', 'com.vn', 'com.th', 'com.id', 'com.kr', 'com.jp', 'net.au', 'org.uk', 'gov.uk', 'ac.uk', 'edu.au', 'gov.au', 'net.au', 'org.au']
    
    // Check if the last 2 parts form a two-part TLD
    const lastTwoParts = domainParts.length >= 2 
      ? domainParts.slice(-2).join('.') 
      : ''
    const isTwoPartTld = twoPartTlds.includes(lastTwoParts.toLowerCase())
    
    // Determine if we need to add www.
    // If domain has only 2 parts (domain.tld) OR 
    // if domain has 3 parts and last 2 form a two-part TLD (domain.co.il)
    let finalDomain = domain
    if (domainParts.length === 2) {
      // Simple case: domain.tld -> www.domain.tld
      finalDomain = 'www.' + domain
    } else if (domainParts.length === 3 && isTwoPartTld) {
      // Two-part TLD case: domain.co.il -> www.domain.co.il
      finalDomain = 'www.' + domain
    }
    // If domainParts.length > 3 or already has subdomain, leave as is
    
    // Reconstruct URL with protocol
    if (!protocol) {
      protocol = 'https://'
    }
    
    formatted = protocol + finalDomain + path
    
    return formatted
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a website URL (e.g., wix.com, github.com)')
      return
    }
    
    const formattedUrl = formatUrl(url)
    
    // Update the input field to show the formatted URL
    setUrl(formattedUrl)
    if (onValueChange) {
      onValueChange(formattedUrl)
    }
    
    // Submit the formatted URL
    onSubmit(formattedUrl)
  }
  
  const handleChange = (e) => {
    const newValue = e.target.value
    setUrl(newValue)
    if (onValueChange) {
      onValueChange(newValue)
    }
    if (error) setError('')
  }
  
  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <div className="url-input-container">
        <label htmlFor="website-url" className="sr-only">
          Website URL
        </label>
        <div className="url-input-group">
          <input
            id="website-url"
            type="text"
            value={url}
            onChange={handleChange}
            placeholder="Paste any website URL to test accessibility"
            disabled={loading}
            className="url-input"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'url-error' : undefined}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="submit-button"
            aria-label={loading ? 'Loading website' : 'Test website accessibility'}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
                <span>Test Now</span>
              </>
            )}
          </button>
        </div>
      </div>
      {error && (
        <p id="url-error" className="error-message" role="alert">
          {error}
        </p>
      )}
      
      <style jsx>{`
        .url-input-form {
          width: 100%;
        }
        
        .url-input-container {
          width: 100%;
        }
        
        .url-input-group {
          display: flex;
          align-items: stretch;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(110, 198, 255, 0.25);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06),
                      0 0 0 1px rgba(0, 0, 0, 0.02);
          min-height: 64px;
        }
        
        .url-input-group:hover {
          border-color: rgba(110, 198, 255, 0.4);
          box-shadow: 0 4px 16px rgba(110, 198, 255, 0.15),
                      0 2px 8px rgba(0, 0, 0, 0.1),
                      0 0 0 1px rgba(110, 198, 255, 0.2);
          transform: translateY(-3px);
        }
        
        .url-input-group:focus-within {
          border-color: #4A90E2;
          border-width: 2px;
          box-shadow: 0 0 0 4px rgba(110, 198, 255, 0.2),
                      0 8px 24px rgba(110, 198, 255, 0.25),
                      0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-3px);
        }
        
        .url-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 20px 24px;
          font-size: 16px;
          font-weight: 500;
          color: #1A1A1A;
          outline: none;
          min-width: 0;
          line-height: 1.5;
          letter-spacing: -0.01em;
          border-radius: 16px 0 0 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .url-input::placeholder {
          color: #6B7280;
          font-weight: 400;
          transition: color 0.2s ease;
        }
        
        .url-input:focus::placeholder {
          color: rgba(107, 114, 128, 0.6);
        }
        
        .url-input:disabled {
          background: rgba(0, 0, 0, 0.02);
          color: rgba(0, 0, 0, 0.4);
          cursor: not-allowed;
        }
        
        .url-input:disabled::placeholder {
          color: rgba(0, 0, 0, 0.3);
        }
        
        .submit-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 32px;
          border: none;
          background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
          color: #FFFFFF;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          border-left: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0 16px 16px 0;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          box-shadow: 0 2px 4px rgba(74, 144, 226, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #7BB3FF 0%, #4A90E2 100%);
          opacity: 0;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 0 16px 16px 0;
        }
        
        .submit-button:hover:not(:disabled)::before {
          opacity: 1;
        }
        
        .submit-button:hover:not(:disabled) {
          transform: scale(1.03) translateY(-1px);
          box-shadow: 0 4px 12px rgba(74, 144, 226, 0.35),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        .submit-button:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
          box-shadow: 0 1px 2px rgba(74, 144, 226, 0.3),
                      inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .submit-button svg {
          position: relative;
          z-index: 1;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .submit-button:hover:not(:disabled) svg {
          transform: translateX(4px);
        }
        
        .submit-button span {
          position: relative;
          z-index: 1;
        }
        
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.4);
          box-shadow: none;
        }
        
        .submit-button:disabled::before {
          display: none;
        }
        
        .url-input-group:has(.url-input:disabled) {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .url-input-group:has(.url-input:disabled):hover {
          transform: none;
          border-color: rgba(110, 198, 255, 0.25);
        }
        
        .spinner {
          position: relative;
          z-index: 1;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-message {
          color: #DC2626;
          background: rgba(239, 68, 68, 0.1);
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 12px;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.5;
        }
        
        .url-input-group:has(.url-input[aria-invalid="true"]) {
          border-color: #EF4444;
          border-width: 2px;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15),
                      0 4px 12px rgba(239, 68, 68, 0.2);
        }
        
        .url-input-group:has(.url-input[aria-invalid="true"]) .url-input {
          background: rgba(239, 68, 68, 0.05);
        }
        
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
        
        @media (max-width: 600px) {
          .url-input-group {
            flex-direction: column;
            min-height: auto;
            border-radius: 16px;
          }
          
          .url-input {
            padding: 16px 20px;
            border-radius: 16px 16px 0 0;
          }
          
          .submit-button {
            width: 100%;
            padding: 16px 24px;
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 0 0 16px 16px;
            box-shadow: none;
          }
          
          .submit-button:hover:not(:disabled) {
            transform: scale(1.01);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .url-input-group,
          .url-input,
          .submit-button,
          .submit-button svg {
            transition: none !important;
            animation: none !important;
          }
          
          .url-input-group:hover,
          .url-input-group:focus-within {
            transform: none !important;
          }
          
          .submit-button:hover:not(:disabled) {
            transform: none !important;
          }
        }
        
        /* Dark mode styles */
        :global([data-theme="dark"]) .url-input-group {
          background: rgba(40, 42, 54, 0.98);
          border-color: rgba(110, 198, 255, 0.35);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4),
                      0 0 0 1px rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        
        :global([data-theme="dark"]) .url-input-group:hover {
          border-color: rgba(110, 198, 255, 0.55);
          box-shadow: 0 4px 20px rgba(110, 198, 255, 0.25),
                      0 2px 12px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(110, 198, 255, 0.4);
          transform: translateY(-3px);
        }
        
        :global([data-theme="dark"]) .url-input-group:focus-within {
          border-color: #60A5FA;
          border-width: 2px;
          box-shadow: 0 0 0 4px rgba(110, 198, 255, 0.3),
                      0 8px 28px rgba(110, 198, 255, 0.35),
                      0 4px 16px rgba(0, 0, 0, 0.6);
          transform: translateY(-3px);
        }
        
        :global([data-theme="dark"]) .url-input {
          color: rgba(255, 255, 255, 0.98);
        }
        
        :global([data-theme="dark"]) .url-input::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }
        
        :global([data-theme="dark"]) .url-input:focus::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }
        
        :global([data-theme="dark"]) .url-input:disabled {
          background: rgba(0, 0, 0, 0.25);
          color: rgba(255, 255, 255, 0.45);
        }
        
        :global([data-theme="dark"]) .url-input:disabled::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        
        :global([data-theme="dark"]) .submit-button:disabled {
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.45);
          border-left-color: rgba(255, 255, 255, 0.1);
        }
        
        :global([data-theme="dark"]) .url-input-group:has(.url-input[aria-invalid="true"]) {
          border-color: #F87171;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25),
                      0 4px 16px rgba(239, 68, 68, 0.35);
        }
        
        :global([data-theme="dark"]) .url-input-group:has(.url-input[aria-invalid="true"]) .url-input {
          background: rgba(239, 68, 68, 0.12);
        }
        
        :global([data-theme="dark"]) .error-message {
          color: #FCA5A5;
          background: rgba(239, 68, 68, 0.25);
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        :global([data-theme="dark"]) .submit-button {
          border-left-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 6px rgba(74, 144, 226, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        :global([data-theme="dark"]) .submit-button:hover:not(:disabled) {
          box-shadow: 0 4px 14px rgba(74, 144, 226, 0.45),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        @media (max-width: 600px) {
          :global([data-theme="dark"]) .submit-button {
            border-top-color: rgba(255, 255, 255, 0.15);
          }
        }
      `}</style>
    </form>
  )
}

