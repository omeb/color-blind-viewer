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
 * Injects base tag and CSS to hide skip links into HTML
 * @param {string} html - Original HTML
 * @param {string} baseUrl - Base URL to inject
 * @returns {string} Modified HTML
 */
function injectBaseTag(html, baseUrl) {
  const baseTag = `<base href="${baseUrl}" target="_parent">`
  
  // CSS to hide skip links and accessibility elements that shouldn't be visible
  const hideSkipLinksCSS = `
    <style>
      /* Hide skip navigation links */
      a[href="#main"],
      a[href="#content"], 
      a[href="#main-content"],
      a[class*="skip"],
      a[class*="sr-only"]:not(:focus),
      .skip-link:not(:focus),
      .screen-reader-text:not(:focus),
      .visually-hidden:not(:focus),
      .sr-only:not(:focus) {
        position: absolute !important;
        left: -10000px !important;
        top: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
        clip: rect(1px, 1px, 1px, 1px) !important;
        clip-path: inset(50%) !important;
      }
      
      /* Specifically target common skip link patterns */
      a[href*="skip"]:not(:focus),
      a[aria-label*="skip"]:not(:focus),
      a[title*="skip"]:not(:focus) {
        position: absolute !important;
        left: -10000px !important;
        top: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      }
    </style>
  `
  
  const injectionContent = baseTag + hideSkipLinksCSS
  
  // Try to inject after <head> tag
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${injectionContent}`)
  }
  
  // Try to inject after <head ...> tag with attributes
  if (html.match(/<head[^>]*>/i)) {
    return html.replace(/<head[^>]*>/i, match => `${match}${injectionContent}`)
  }
  
  // If no head tag, inject at the beginning
  return injectionContent + html
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

