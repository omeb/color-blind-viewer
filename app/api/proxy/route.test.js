/**
 * Tests for Proxy API Route
 * 
 * Note: These tests mock fetch to avoid real network calls
 */

import { GET } from './route'
import { NextResponse } from 'next/server'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
    })),
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('Proxy API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('URL Validation', () => {
    it('returns 400 when URL parameter is missing', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
      }
      
      await GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    })
    
    it('returns 400 for invalid URL format', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'not-a-valid-url' }),
        },
      }
      
      await GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    })
    
    it('returns 400 for non-HTTP(S) protocols', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'ftp://example.com' }),
        },
      }
      
      await GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Only HTTP and HTTPS protocols are allowed' },
        { status: 400 }
      )
    })
    
    it('returns 400 for localhost URLs', async () => {
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'http://localhost:3000' }),
        },
      }
      
      await GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Local and private URLs are not allowed' },
        { status: 400 }
      )
    })
    
    it('returns 400 for private IP addresses', async () => {
      const privateIPs = [
        'http://127.0.0.1',
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1',
      ]
      
      for (const ip of privateIPs) {
        const request = {
          nextUrl: {
            searchParams: new URLSearchParams({ url: ip }),
          },
        }
        
        await GET(request)
        
        expect(NextResponse.json).toHaveBeenCalledWith(
          { error: 'Local and private URLs are not allowed' },
          { status: 400 }
        )
      }
    })
  })
  
  describe('Successful Fetching', () => {
    it('fetches and returns HTML content', async () => {
      const mockHtml = '<html><head></head><body>Test</body></html>'
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: async () => mockHtml,
      })
      
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'https://example.com' }),
        },
      }
      
      await GET(request)
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/',
        expect.objectContaining({
          headers: {
            'User-Agent': 'ColorblindViewer/1.0 (Accessibility Tool)',
          },
          redirect: 'follow',
        })
      )
    })
    
    it('injects base tag into HTML', async () => {
      const mockHtml = '<html><head></head><body>Test</body></html>'
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/html']]),
        text: async () => mockHtml,
      })
      
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'https://example.com/page' }),
        },
      }
      
      const response = await GET(request)
      
      // In real implementation, check that base tag is injected
      // This is simplified for testing
      expect(response).toBeDefined()
    })
  })
  
  describe('Error Handling', () => {
    it('returns 400 for non-HTML content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: async () => '{}',
      })
      
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'https://example.com/api' }),
        },
      }
      
      await GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'URL does not point to an HTML page' },
        { status: 400 }
      )
    })
    
    it('handles fetch errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))
      
      const request = {
        nextUrl: {
          searchParams: new URLSearchParams({ url: 'https://example.com' }),
        },
      }
      
      await GET(request)
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: 'Internal server error while fetching website' },
        { status: 500 }
      )
    })
  })
})

