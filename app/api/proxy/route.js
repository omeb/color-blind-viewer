/**
 * Proxy API Route
 * 
 * This route fetches external websites to bypass CORS restrictions.
 * It validates URLs, fetches content, and injects necessary tags for proper rendering.
 * 
 * @module api/proxy
 */

import { NextResponse } from 'next/server'

/**
 * Validates if a URL is safe to fetch
 * @param {string} urlString - URL to validate
 * @returns {Object} { valid: boolean, url: URL|null, error: string|null }
 */
function validateUrl(urlString) {
  if (!urlString) {
    return { valid: false, url: null, error: 'URL parameter is required' }
  }
  
  try {
    const url = new URL(urlString)
    
    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, url: null, error: 'Only HTTP and HTTPS protocols are allowed' }
    }
    
    // Block localhost and private IPs for security
    const hostname = url.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return { valid: false, url: null, error: 'Local and private URLs are not allowed' }
    }
    
    return { valid: true, url, error: null }
  } catch (error) {
    return { valid: false, url: null, error: 'Invalid URL format' }
  }
}

/**
 * Removes skip navigation links and injects base tag into HTML
 * @param {string} html - Original HTML
 * @param {string} baseUrl - Base URL to inject
 * @returns {string} Modified HTML
 */
function injectBaseTag(html, baseUrl) {
  const baseTag = `<base href="${baseUrl}" target="_parent">`
  
  // Remove skip navigation links entirely from HTML
  let cleanedHtml = html
  
  // Remove common skip link patterns
  cleanedHtml = cleanedHtml.replace(/<a[^>]*href\s*=\s*["'][#]?(main|content|main-content|skip)[^"']*["'][^>]*>.*?<\/a>/gi, '')
  cleanedHtml = cleanedHtml.replace(/<a[^>]*class\s*=\s*["'][^"']*skip[^"']*["'][^>]*>.*?<\/a>/gi, '')
  cleanedHtml = cleanedHtml.replace(/<a[^>]*class\s*=\s*["'][^"']*sr-only[^"']*["'][^>]*>.*?<\/a>/gi, '')
  cleanedHtml = cleanedHtml.replace(/<a[^>]*aria-label\s*=\s*["'][^"']*skip[^"']*["'][^>]*>.*?<\/a>/gi, '')
  
  // Remove elements with skip-related classes
  cleanedHtml = cleanedHtml.replace(/<[^>]*class\s*=\s*["'][^"']*skip-link[^"']*["'][^>]*>.*?<\/[^>]*>/gi, '')
  cleanedHtml = cleanedHtml.replace(/<[^>]*class\s*=\s*["'][^"']*screen-reader[^"']*["'][^>]*>.*?<\/[^>]*>/gi, '')
  cleanedHtml = cleanedHtml.replace(/<[^>]*class\s*=\s*["'][^"']*visually-hidden[^"']*["'][^>]*>.*?<\/[^>]*>/gi, '')
  
  // JavaScript to directly hide skip links
  const hideSkipLinksScript = `
    <script>
      // Hide skip links immediately when DOM loads
      function hideSkipLinks() {
        // Target the exact skip link element
        const skipLinks = document.querySelectorAll('a[href="#main-content"]');
        skipLinks.forEach(link => {
          if (link.classList.contains('skip-link')) {
            link.style.display = 'none';
          }
        });
        
        // Also target any element with skip-link class
        const skipLinkElements = document.querySelectorAll('.skip-link');
        skipLinkElements.forEach(element => {
          element.style.display = 'none';
        });
      }
      
      // Run immediately and on DOM ready
      hideSkipLinks();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideSkipLinks);
      }
      
      // Also run after a short delay to catch dynamically added elements
      setTimeout(hideSkipLinks, 100);
    </script>
  `
  
  const injectionContent = baseTag + hideSkipLinksScript
  
  // Try to inject after <head> tag
  if (cleanedHtml.includes('<head>')) {
    return cleanedHtml.replace('<head>', `<head>${injectionContent}`)
  }
  
  // Try to inject after <head ...> tag with attributes
  if (cleanedHtml.match(/<head[^>]*>/i)) {
    return cleanedHtml.replace(/<head[^>]*>/i, match => `${match}${injectionContent}`)
  }
  
  // If no head tag, inject at the beginning
  return injectionContent + cleanedHtml
}

/**
 * GET handler for proxy endpoint
 * @param {Request} request - Next.js request object
 * @returns {Response} Proxied content or error
 */
export async function GET(request) {
  try {
    // Get URL from query parameters
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    // Validate URL
    const validation = validateUrl(targetUrl)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Fetch the website with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    try {
      const response = await fetch(validation.url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ColorblindViewer/1.0 (Accessibility Tool)',
        },
        redirect: 'follow',
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch website: ${response.status} ${response.statusText}` },
          { status: response.status }
        )
      }
      
      // Get content type
      const contentType = response.headers.get('content-type') || ''
      
      // Only process HTML content
      if (!contentType.includes('text/html')) {
        return NextResponse.json(
          { error: 'URL does not point to an HTML page' },
          { status: 400 }
        )
      }
      
      // Get HTML content
      let html = await response.text()
      
      // Inject base tag to fix relative URLs
      html = injectBaseTag(html, validation.url.origin + validation.url.pathname)
      
      // Return HTML with appropriate headers
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout: Website took too long to respond' },
          { status: 504 }
        )
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error while fetching website' },
      { status: 500 }
    )
  }
}

