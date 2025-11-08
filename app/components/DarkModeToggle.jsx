'use client'

import React from 'react'

/**
 * Dark Mode Toggle Component
 * 
 * Provides a three-state toggle for theme selection:
 * - Auto (system preference)
 * - Light mode
 * - Dark mode
 */
export default function DarkModeToggle() {
  const [theme, setTheme] = React.useState('auto')
  const [mounted, setMounted] = React.useState(false)

  // Initialize theme from localStorage or system preference
  React.useEffect(() => {
    const root = document.documentElement
    
    // Apply theme immediately to prevent flash
    const savedTheme = localStorage.getItem('colorblind-viewer-theme')
    let initialTheme = 'auto'
    
    if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
      initialTheme = savedTheme
    }
    
    // Apply theme immediately before React state updates
    if (initialTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', initialTheme)
    }
    
    setTheme(initialTheme)
    setMounted(true)
  }, [])

  // Apply theme to document when theme changes
  React.useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleChange)
      
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      root.setAttribute('data-theme', theme)
    }
    
    // Save to localStorage
    localStorage.setItem('colorblind-viewer-theme', theme)
  }, [theme, mounted])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  if (!mounted) {
    // Prevent hydration mismatch by not rendering until mounted
    return null
  }

  const thumbPosition = theme === 'auto' ? 0 : theme === 'light' ? 1 : 2

  return (
    <div className="dark-mode-toggle" style={{ '--thumb-position': thumbPosition }}>
      <button
        onClick={() => handleThemeChange('auto')}
        className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
        aria-label="Auto theme (system preference)"
        title="Auto (system preference)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      </button>
      <button
        onClick={() => handleThemeChange('light')}
        className={`theme-option ${theme === 'light' ? 'active' : ''}`}
        aria-label="Light theme"
        title="Light mode"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
        aria-label="Dark theme"
        title="Dark mode"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
      
      <style jsx>{`
        .dark-mode-toggle {
          display: flex;
          align-items: center;
          gap: 0;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 3px;
          position: relative;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        
        .theme-option {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.65);
          cursor: pointer;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 1;
          min-width: 32px;
        }
        
        .theme-option:hover {
          color: rgba(255, 255, 255, 0.95);
        }
        
        .theme-option.active {
          color: rgba(255, 255, 255, 1);
        }
        
        .theme-option svg {
          width: 14px;
          height: 14px;
        }
        
        /* Active indicator thumb */
        .dark-mode-toggle::before {
          content: '';
          position: absolute;
          top: 3px;
          left: calc(3px + var(--thumb-position) * calc((100% - 6px) / 3));
          width: calc((100% - 6px) / 3);
          height: calc(100% - 6px);
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 7px;
          transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}

