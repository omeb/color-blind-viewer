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
const UrlInput = React.forwardRef(function UrlInput({ onSubmit, loading = false, value: externalValue, onValueChange }, ref) {
  const [url, setUrl] = React.useState('')
  const [error, setError] = React.useState('')
  const inputRef = React.useRef(null)
  
  // Expose focus method via ref
  React.useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    },
    select: () => {
      inputRef.current?.select()
    }
  }))
  
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
    let domain = pathMatch ? pathMatch[1] : rest
    const path = pathMatch ? pathMatch[2] : ''
    
    // If domain has no dot character, append .com
    if (domain && !domain.includes('.')) {
      domain = domain + '.com'
    }
    
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
            ref={inputRef}
            id="website-url"
            type="text"
            inputMode="url"
            value={url}
            onChange={handleChange}
            placeholder="Enter website URL"
            disabled={loading}
            className="url-input"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'url-error' : undefined}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="url"
            spellCheck="false"
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
          background: rgba(250, 250, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(110, 198, 255, 0.5);
          border-radius: var(--radius-md);
          overflow: visible;
          transition: background 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                      backdrop-filter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06),
                      0 0 0 1px rgba(0, 0, 0, 0.02);
          min-height: 38px;
          height: 38px; /* Default height for desktop */
          position: relative;
          animation: invitePulse 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        @keyframes invitePulse {
          0%, 100% {
            border-color: rgba(110, 198, 255, 0.5);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06),
                        0 0 0 1px rgba(0, 0, 0, 0.02),
                        0 0 0 0 rgba(110, 198, 255, 0);
          }
          50% {
            border-color: rgba(74, 144, 226, 0.85);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06),
                        0 0 0 1px rgba(0, 0, 0, 0.02),
                        0 0 40px 8px rgba(110, 198, 255, 0.5),
                        0 0 60px 12px rgba(110, 198, 255, 0.25),
                        0 0 80px 16px rgba(110, 198, 255, 0.1);
          }
        }
        
        .url-input-group::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.05) 0%, rgba(74, 144, 226, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
          border-radius: var(--radius-md);
        }
        
        .url-input-group:hover:not(:focus-within) {
          border-color: rgba(110, 198, 255, 0.5);
          box-shadow: 0 4px 20px rgba(110, 198, 255, 0.2),
                      0 2px 10px rgba(0, 0, 0, 0.1),
                      0 0 0 1px rgba(110, 198, 255, 0.3),
                      0 0 30px 4px rgba(110, 198, 255, 0.15);
          animation: none;
        }
        
        .url-input-group:hover::before {
          opacity: 1;
        }
        
        .url-input-group:focus-within {
          border-color: #4A90E2;
          /* Keep border-width constant to prevent layout shift - use box-shadow for visual emphasis */
          border-width: 1.5px;
          box-shadow: 0 0 0 6px rgba(110, 198, 255, 0.15),
                      0 12px 32px rgba(110, 198, 255, 0.3),
                      0 6px 16px rgba(0, 0, 0, 0.15),
                      0 0 40px 8px rgba(110, 198, 255, 0.2),
                      inset 0 0 0 0.5px rgba(74, 144, 226, 0.5);
          animation: focusGlow 2s ease-in-out infinite;
        }
        
        @keyframes focusGlow {
          0%, 100% {
            box-shadow: 0 0 0 6px rgba(110, 198, 255, 0.15),
                        0 12px 32px rgba(110, 198, 255, 0.3),
                        0 6px 16px rgba(0, 0, 0, 0.15),
                        0 0 40px 8px rgba(110, 198, 255, 0.2),
                        inset 0 0 0 0.5px rgba(74, 144, 226, 0.5);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(110, 198, 255, 0.2),
                        0 12px 32px rgba(110, 198, 255, 0.35),
                        0 6px 16px rgba(0, 0, 0, 0.15),
                        0 0 50px 10px rgba(110, 198, 255, 0.25),
                        inset 0 0 0 0.5px rgba(74, 144, 226, 0.5);
          }
        }
        
        .url-input-group:focus-within::before {
          opacity: 1;
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.1) 0%, rgba(74, 144, 226, 0.1) 100%);
        }
        
        .url-input-group:focus-within .submit-button {
          /* Keep margin constant to prevent layout shift */
          margin: 0 -3px 0 0;
          animation: buttonPulse 2s ease-in-out infinite;
        }
        
        @keyframes buttonPulse {
          0%, 100% {
            box-shadow: 0 4px 14px rgba(0, 122, 255, 0.25),
                        0 2px 6px rgba(0, 122, 255, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 6px 18px rgba(0, 122, 255, 0.35),
                        0 3px 8px rgba(0, 122, 255, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25);
          }
        }
        
        .url-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 8px 24px;
          font-size: 16px;
          font-weight: 500;
          color: #1A1A1A;
          outline: none;
          min-width: 0;
          line-height: 1.5;
          letter-spacing: -0.01em;
          border-radius: var(--radius-md) 0 0 var(--radius-md);
          border-top-left-radius: var(--radius-md);
          border-bottom-left-radius: var(--radius-md);
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          /* No transitions to prevent cursor movement on iOS */
          transition: none;
          position: relative;
          z-index: 2;
          /* Prevent any transforms that could affect cursor position */
          transform: none;
          display: flex;
          align-items: center;
          height: 38px;
          /* Ensure standard cursor appearance - no animations */
          caret-color: #007AFF;
        }
        
        .url-input:focus {
          padding: 8px 24px;
          /* No transitions when focused to prevent cursor animation */
          transition: none;
          /* Standard caret color - no special styling */
          caret-color: #007AFF;
        }
        
        .url-input::placeholder {
          color: #6B7280;
          font-weight: 400;
          /* No transitions to prevent cursor movement */
          transition: none;
          opacity: 1;
          /* Prevent placeholder transforms that could affect cursor */
          transform: none;
        }
        
        .url-input:focus::placeholder {
          color: rgba(107, 114, 128, 0.5);
          opacity: 0.8;
          /* No transitions when focused */
          transition: none;
          /* No transform - prevents cursor jumping */
          transform: none;
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
          gap: 10px;
          padding: 0 40px;
          height: 38px;
          min-height: 38px;
          border: none;
          background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          white-space: nowrap;
          border-left: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          border-top-right-radius: var(--radius-md);
          border-bottom-right-radius: var(--radius-md);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', 'Roboto', sans-serif;
          box-shadow: 0 4px 14px rgba(0, 122, 255, 0.25),
                      0 2px 6px rgba(0, 122, 255, 0.15),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
          margin: 0 -3px 0 0;
          overflow: visible;
          box-sizing: border-box;
          align-self: stretch;
        }
        
        .submit-button:focus-visible {
          outline: 2px solid rgba(0, 122, 255, 0.8);
          outline-offset: -2px;
          height: 38px;
          min-height: 38px;
        }
        
        .submit-button:disabled {
          background: rgba(0, 0, 0, 0.1);
          animation: none; /* No animation when disabled */
        }
        
        .submit-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #0084FF 0%, #0066FF 100%);
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          z-index: 0;
        }
        
        .submit-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 25%,
            rgba(110, 198, 255, 0.35) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 100%
          );
          background-size: 200% 100%;
          background-position: 200% 0;
          border-radius: 0 var(--radius-md) var(--radius-md) 0;
          z-index: 0;
          opacity: 0;
          pointer-events: none;
        }
        
        .submit-button:hover:not(:disabled)::before {
          opacity: 1;
          animation: none; /* Stop pulse animation on hover */
        }
        
        .submit-button:not(:disabled)::after {
          opacity: 1;
          animation: waveFlow 3s ease-in-out infinite;
        }
        
        @keyframes waveFlow {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        .submit-button:hover:not(:disabled)::after {
          animation: none;
          background: rgba(255, 255, 255, 0.3);
          background-size: auto;
          background-position: center;
          border-radius: 50%;
          width: 0;
          height: 0;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .submit-button:hover:not(:disabled)::after {
          width: 300px;
          height: 300px;
        }
        
        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.35),
                      0 4px 12px rgba(0, 122, 255, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        
        .submit-button:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3),
                      inset 0 2px 4px rgba(0, 0, 0, 0.15);
          transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .submit-button:not(:disabled) {
          background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
        }
        
        .submit-button:not(:disabled)::before {
          opacity: 0;
          animation: gradientPulse 3s ease-in-out infinite;
        }
        
        @keyframes gradientPulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
        }
        
        .submit-button:not(:disabled) svg {
          position: relative;
          z-index: 1;
          transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
          animation: arrowPulse 2s ease-in-out infinite;
        }
        
        @keyframes arrowPulse {
          0%, 100% {
            transform: translateX(0);
            opacity: 1;
          }
          50% {
            transform: translateX(3px);
            opacity: 0.9;
          }
        }
        
        .submit-button:hover:not(:disabled) svg {
          transform: translateX(6px) scale(1.1);
          animation: none; /* Stop pulse animation on hover */
        }
        
        .submit-button:active:not(:disabled) svg {
          transform: translateX(2px) scale(1.05);
          animation: none; /* Stop pulse animation on active */
        }
        
        .submit-button span {
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: rgba(0, 0, 0, 0.1);
          color: rgba(0, 0, 0, 0.4);
          box-shadow: none;
          animation: none; /* No animation when disabled */
        }
        
        .submit-button:disabled svg {
          animation: none; /* No arrow animation when disabled */
        }
        
        .submit-button:disabled::after {
          opacity: 0;
          animation: none;
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
        
        @media (max-width: 768px) {
          .url-input-group {
            flex-direction: column;
            min-height: auto;
            height: auto; /* Allow container to grow to fit button */
            border-radius: var(--radius-md);
            overflow: visible; /* Ensure button is not clipped */
          }
          
          .url-input-group:hover,
          .url-input-group:focus-within {
            transform: none !important;
          }
          
          .url-input {
            padding: 8px 20px;
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            border-top-left-radius: var(--radius-md);
            border-top-right-radius: var(--radius-md);
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            background: rgba(250, 250, 255, 0.92); /* Match container background to cover border-radius */
            transform: none !important;
            height: auto;
            min-height: 38px; /* Ensure input has minimum height */
            /* No transitions on mobile to prevent cursor movement */
            transition: none !important;
          }
          
          .url-input:focus {
            padding: 8px 20px;
            background: rgba(250, 250, 255, 0.92); /* Maintain background on focus */
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            transform: none !important;
            /* No transitions when focused on mobile */
            transition: none !important;
          }
          
          .url-input::placeholder {
            transform: none !important;
            /* No transitions on placeholder for mobile */
            transition: none !important;
          }
          
          .url-input:focus::placeholder {
            /* No transitions when focused on mobile */
            transition: none !important;
            transform: none !important;
          }
          
          .submit-button {
            width: 100%;
            padding: 0 32px;
            height: 38px;
            min-height: 38px; /* Ensure button has minimum height */
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
            border-radius: 0 0 15px 15px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
            box-shadow: 0 4px 14px rgba(0, 122, 255, 0.25),
                        0 2px 6px rgba(0, 122, 255, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
            margin: 0; /* Remove negative margins to prevent clipping */
            display: flex !important; /* Ensure button is visible */
            visibility: visible !important;
            opacity: 1 !important;
            position: relative; /* Ensure button is positioned correctly */
            z-index: 1; /* Ensure button is above other elements */
          }
          
          .submit-button::before {
            border-radius: 0 0 15px 15px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
          }
          
          .submit-button::after {
            border-radius: 0 0 15px 15px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            border-bottom-left-radius: 15px;
            border-bottom-right-radius: 15px;
          }
          
          .submit-button:hover:not(:disabled) {
            transform: translateY(-1px) scale(1.01);
            box-shadow: 0 6px 20px rgba(0, 122, 255, 0.3),
                        0 3px 10px rgba(0, 122, 255, 0.2),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25);
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
                      0 0 0 1px rgba(255, 255, 255, 0.08),
                      0 0 0 0 rgba(110, 198, 255, 0);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: invitePulseDark 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        
        @keyframes invitePulseDark {
          0%, 100% {
            border-color: rgba(110, 198, 255, 0.45);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.08),
                        0 0 0 0 rgba(110, 198, 255, 0);
          }
          50% {
            border-color: rgba(110, 198, 255, 0.7);
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4),
                        0 0 0 1px rgba(255, 255, 255, 0.08),
                        0 0 38px 7px rgba(110, 198, 255, 0.35),
                        0 0 60px 10px rgba(110, 198, 255, 0.15);
          }
        }
        
        :global([data-theme="dark"]) .url-input-group::before {
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.08) 0%, rgba(74, 144, 226, 0.08) 100%);
        }
        
        :global([data-theme="dark"]) .url-input-group:hover:not(:focus-within) {
          border-color: rgba(110, 198, 255, 0.6);
          box-shadow: 0 4px 24px rgba(110, 198, 255, 0.3),
                      0 2px 12px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(110, 198, 255, 0.4),
                      0 0 35px 5px rgba(110, 198, 255, 0.2);
          animation: none;
        }
        
        :global([data-theme="dark"]) .url-input-group:focus-within {
          border-color: #60A5FA;
          /* Keep border-width constant to prevent layout shift */
          border-width: 1.5px;
          box-shadow: 0 0 0 6px rgba(110, 198, 255, 0.25),
                      0 12px 36px rgba(110, 198, 255, 0.4),
                      0 6px 18px rgba(0, 0, 0, 0.6),
                      0 0 45px 10px rgba(110, 198, 255, 0.3),
                      inset 0 0 0 0.5px rgba(96, 165, 250, 0.5);
          animation: focusGlowDark 2s ease-in-out infinite;
        }
        
        @keyframes focusGlowDark {
          0%, 100% {
            box-shadow: 0 0 0 6px rgba(110, 198, 255, 0.25),
                        0 12px 36px rgba(110, 198, 255, 0.4),
                        0 6px 18px rgba(0, 0, 0, 0.6),
                        0 0 45px 10px rgba(110, 198, 255, 0.3),
                        inset 0 0 0 0.5px rgba(96, 165, 250, 0.5);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(110, 198, 255, 0.3),
                        0 12px 36px rgba(110, 198, 255, 0.45),
                        0 6px 18px rgba(0, 0, 0, 0.6),
                        0 0 55px 12px rgba(110, 198, 255, 0.35),
                        inset 0 0 0 0.5px rgba(96, 165, 250, 0.5);
          }
        }
        
        :global([data-theme="dark"]) .url-input-group:focus-within::before {
          background: linear-gradient(135deg, rgba(110, 198, 255, 0.12) 0%, rgba(74, 144, 226, 0.12) 100%);
        }
        
        :global([data-theme="dark"]) .url-input-group:focus-within .submit-button {
          /* Keep margin constant to prevent layout shift */
          margin: 0 -3px 0 0;
          animation: buttonPulseDark 2s ease-in-out infinite;
        }
        
        @keyframes buttonPulseDark {
          0%, 100% {
            box-shadow: 0 4px 16px rgba(10, 132, 255, 0.35),
                        0 2px 8px rgba(10, 132, 255, 0.25),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 6px 20px rgba(10, 132, 255, 0.45),
                        0 3px 10px rgba(10, 132, 255, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.25);
          }
        }
        
        :global([data-theme="dark"]) .url-input {
          color: rgba(255, 255, 255, 0.98);
        }
        
        :global([data-theme="dark"]) .url-input::placeholder {
          color: rgba(255, 255, 255, 0.55);
        }
        
        :global([data-theme="dark"]) .url-input:focus::placeholder {
          color: rgba(255, 255, 255, 0.45);
          /* No transform - prevents cursor jumping */
          transform: none;
        }
        
        :global([data-theme="dark"]) .url-input:disabled {
          background: rgba(0, 0, 0, 0.25);
          color: rgba(255, 255, 255, 0.45);
        }
        
        :global([data-theme="dark"]) .url-input:disabled::placeholder {
          color: rgba(255, 255, 255, 0.35);
        }
        
        :global([data-theme="dark"]) .submit-button:not(:disabled) {
          background: linear-gradient(135deg, #0A84FF 0%, #0051D5 100%);
        }
        
        :global([data-theme="dark"]) .submit-button:not(:disabled)::before {
          animation: gradientPulseDark 3s ease-in-out infinite;
        }
        
        @keyframes gradientPulseDark {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        :global([data-theme="dark"]) .submit-button:not(:disabled) svg {
          animation: arrowPulse 2s ease-in-out infinite;
        }
        
        :global([data-theme="dark"]) .submit-button:disabled {
          background: rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.45);
          border-left-color: rgba(255, 255, 255, 0.1);
          animation: none; /* No animation when disabled */
        }
        
        :global([data-theme="dark"]) .submit-button:disabled svg {
          animation: none; /* No arrow animation when disabled */
        }
        
        :global([data-theme="dark"]) .submit-button:disabled::after {
          opacity: 0;
          animation: none;
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
          background: linear-gradient(135deg, #0A84FF 0%, #0051D5 100%);
          border-left-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 4px 16px rgba(10, 132, 255, 0.35),
                      0 2px 8px rgba(10, 132, 255, 0.25),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        
        :global([data-theme="dark"]) .submit-button::before {
          background: linear-gradient(135deg, #1A94FF 0%, #0066FF 100%);
        }
        
        :global([data-theme="dark"]) .submit-button:not(:disabled)::after {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.2) 25%,
            rgba(110, 198, 255, 0.45) 50%,
            rgba(255, 255, 255, 0.2) 75%,
            transparent 100%
          );
          opacity: 1;
          animation: waveFlow 3s ease-in-out infinite;
        }
        
        :global([data-theme="dark"]) .submit-button:hover:not(:disabled)::before {
          opacity: 1;
          animation: none; /* Stop pulse animation on hover */
        }
        
        :global([data-theme="dark"]) .submit-button:hover:not(:disabled)::after {
          animation: none;
          background: rgba(255, 255, 255, 0.3);
          background-size: auto;
          background-position: center;
          border-radius: 50%;
          width: 0;
          height: 0;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                      height 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        :global([data-theme="dark"]) .submit-button:hover:not(:disabled)::after {
          width: 300px;
          height: 300px;
        }
        
        :global([data-theme="dark"]) .submit-button:hover:not(:disabled) {
          box-shadow: 0 8px 28px rgba(10, 132, 255, 0.45),
                      0 4px 14px rgba(10, 132, 255, 0.35),
                      inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        
        @media (max-width: 768px) {
          :global([data-theme="dark"]) .submit-button {
            border-top-color: rgba(255, 255, 255, 0.15);
            display: flex !important; /* Ensure button is visible */
            visibility: visible !important;
            opacity: 1 !important;
          }
          
          :global([data-theme="dark"]) .url-input {
            background: rgba(40, 42, 54, 0.98); /* Match dark container background */
          }
          
          :global([data-theme="dark"]) .url-input:focus {
            background: rgba(40, 42, 54, 0.98); /* Maintain dark background on focus */
          }
        }
      `}</style>
    </form>
  )
})

export default UrlInput

