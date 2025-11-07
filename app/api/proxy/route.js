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
 * Injects base tag into HTML to fix relative URLs
 * @param {string} html - Original HTML
 * @param {string} baseUrl - Base URL to inject
 * @returns {string} Modified HTML
 */
function injectBaseTag(html, baseUrl) {
  const baseTag = `<base href="${baseUrl}" target="_parent">`
  
  // Try to inject after <head> tag
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${baseTag}`)
  }
  
  // Try to inject after <head ...> tag with attributes
  if (html.match(/<head[^>]*>/i)) {
    return html.replace(/<head[^>]*>/i, match => `${match}${baseTag}`)
  }
  
  // If no head tag, inject at the beginning
  return baseTag + html
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

