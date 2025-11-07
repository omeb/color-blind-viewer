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
 */
export default function UrlInput({ onSubmit, loading = false }) {
  const [url, setUrl] = React.useState('')
  const [error, setError] = React.useState('')
  
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a website URL (e.g., wix.com, github.com)')
      return
    }
    
    let formattedUrl = url.trim()
    
    // Remove spaces
    formattedUrl = formattedUrl.replace(/\s+/g, '')
    
    // Fix common typos: replace -com, -org, -net with .com, .org, .net
    formattedUrl = formattedUrl.replace(/-(com|org|net|io|co|edu|gov)$/i, '.$1')
    
    // Auto-add https:// if no protocol specified
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl
    }
    
    // Try to validate URL
    try {
      new URL(formattedUrl)
      onSubmit(formattedUrl)
    } catch (err) {
      // If validation fails, try adding www.
      try {
        const urlWithWww = formattedUrl.replace('https://', 'https://www.')
        new URL(urlWithWww)
        onSubmit(urlWithWww)
      } catch (err2) {
        setError('Invalid website address. Try: example.com, www.example.com, or check for typos')
      }
    }
  }
  
  const handleChange = (e) => {
    setUrl(e.target.value)
    if (error) setError('')
  }
  
  return (
    <form onSubmit={handleSubmit} className="url-input-form">
      <div className="url-input-container">
        <label htmlFor="website-url" className="sr-only">
          Website URL
        </label>
        <input
          id="website-url"
          type="url"
          value={url}
          onChange={handleChange}
          placeholder="Enter website URL (e.g., example.com)"
          disabled={loading}
          className="url-input"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'url-error' : undefined}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn btn-primary submit-button"
          aria-label={loading ? 'Loading website' : 'View website with filters'}
        >
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true"></span>
              Loading...
            </>
          ) : (
            'View Website'
          )}
        </button>
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
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .url-input {
          flex: 1;
          min-width: 250px;
        }
        
        .submit-button {
          white-space: nowrap;
        }
        
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.1);
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          margin-top: var(--spacing-sm);
          font-size: 0.9rem;
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
          .url-input-container {
            flex-direction: column;
          }
          
          .url-input,
          .submit-button {
            width: 100%;
          }
        }
      `}</style>
    </form>
  )
}

