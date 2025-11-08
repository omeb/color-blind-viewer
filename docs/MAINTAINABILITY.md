# AI Maintainability Guide

## Purpose
This document helps AI assistants understand the codebase structure, design decisions, and how to maintain/extend this project.

## Project Overview
**Colorblind Viewer** is an accessibility awareness tool that shows how websites appear to people with vision impairments. The goal is to educate web developers about the importance of accessible design.

## Architecture Decisions

### Why Next.js?
- **Single Deployment**: Frontend + backend API in one codebase
- **API Routes**: Built-in serverless functions for the proxy
- **Easy Deployment**: Netlify one-click deployment
- **Modern React**: App Router with React Server Components

### Why Not Separate Backend?
- Simpler maintenance (one codebase vs two)
- No CORS configuration needed
- Easier for contributors to get started
- Serverless timeout (10s) is acceptable for most websites

## Key Components

### `/app/api/proxy/route.js`
**Purpose**: Fetches external websites to bypass CORS restrictions

**How it works**:
1. Accepts URL as query parameter
2. Validates URL format
3. Fetches the website HTML
4. Injects `<base>` tag to fix relative URLs
5. Returns HTML with proper headers

**Why inject base tag**: Relative links (images, CSS, JS) need absolute URLs to work in iframe

**Security**: Validates URLs, sets timeout, blocks localhost/private IPs

### `/app/components/`
All UI components are isolated and testable

**UrlInput.jsx**: 
- Validates URL format before submission
- Shows loading state
- Handles errors gracefully

**WebsiteViewer.jsx**:
- Displays proxied website in iframe
- Applies CSS filters dynamically
- Handles iframe loading states

**ImpairmentControls.jsx**:
- Toggle buttons for each vision impairment
- Clear visual states (active/inactive)
- Keyboard accessible

**InfoPanel.jsx**:
- Educational content about each impairment
- Collapsible sections
- Statistics and impact information

## Vision Impairment Filters

### CSS Filter Approach
We use CSS `filter` property with color matrices to simulate colorblindness.

**Why CSS filters?**
- No external libraries needed
- Hardware accelerated
- Works on any website
- Real-time toggling

**Filter Definitions** (in `app/lib/filters.js`):
- Protanopia (red-blind): Removes red channel
- Deuteranopia (green-blind): Removes green channel
- Tritanopia (blue-blind): Removes blue channel
- Achromatopsia: Full grayscale
- Cataracts: Blur + contrast reduction
- Low Vision: Blur effect

## Testing Strategy

### Unit Tests (`*.test.js`)
- Test component rendering
- Test user interactions
- Test filter calculations
- Test URL validation

### E2E Tests (`/e2e/*.spec.js`)
- Test full user flow
- Test with real proxy requests
- Test accessibility features

### Running Tests
```bash
npm test           # Unit tests (watch mode)
npm run test:ci    # Unit tests (CI mode)
npm run test:e2e   # E2E tests
```

## Styling System

### Glassmorphism Design
- `backdrop-filter: blur()` for frosted glass effect
- Semi-transparent backgrounds
- Soft shadows and subtle borders
- Gradient backgrounds

### Accessibility Requirements
- **Contrast**: Minimum 4.5:1 for text (WCAG AA)
- **Focus States**: Visible keyboard focus indicators
- **ARIA Labels**: All interactive elements
- **Semantic HTML**: Proper heading hierarchy
- **Reduced Motion**: Respects `prefers-reduced-motion`

## Common Maintenance Tasks

### Adding a New Vision Impairment
1. Add filter definition to `app/lib/filters.js`
2. Add button to `ImpairmentControls.jsx`
3. Add info section to `InfoPanel.jsx`
4. Add test case to `filters.test.js`
5. Update documentation

### Fixing Proxy Issues
If certain websites don't load:
1. Check console for CORS errors
2. Verify base tag injection in `/app/api/proxy/route.js`
3. Check for CSP headers blocking iframe
4. Consider adding timeout handling

### Updating Styles
All global styles in `app/globals.css`
Component-specific styles use CSS modules pattern
Maintain WCAG AA contrast ratios

## Deployment

### Netlify (Recommended)
1. Push to GitHub
2. Import repo in Netlify
3. Configure build settings (build command: `npm run build`, publish directory: `.next`)
4. Auto-deploys on every commit

### Environment Variables
None required for basic functionality

## File Structure Map
```
/
├── app/
│   ├── page.js              # Main landing page
│   ├── layout.js            # Root layout with metadata
│   ├── globals.css          # Global styles
│   ├── api/
│   │   └── proxy/
│   │       ├── route.js     # Proxy API endpoint
│   │       └── route.test.js
│   ├── components/          # React components
│   │   ├── UrlInput.jsx
│   │   ├── UrlInput.test.jsx
│   │   ├── WebsiteViewer.jsx
│   │   ├── WebsiteViewer.test.jsx
│   │   ├── ImpairmentControls.jsx
│   │   ├── ImpairmentControls.test.jsx
│   │   ├── InfoPanel.jsx
│   │   └── InfoPanel.test.jsx
│   └── lib/
│       ├── filters.js       # Filter definitions
│       └── filters.test.js
├── e2e/
│   └── app.spec.js          # E2E tests
├── docs/
│   └── MAINTAINABILITY.md   # This file
├── public/                  # Static assets
├── package.json
├── next.config.js
├── jest.config.js
├── playwright.config.js
└── README.md
```

## Troubleshooting

### Issue: Iframe not loading
**Cause**: X-Frame-Options header
**Solution**: This is expected for some sites; inform user

### Issue: Filters not applying
**Cause**: CSS specificity issues
**Solution**: Check iframe wrapper has correct class

### Issue: Tests failing
**Cause**: Missing test environment setup
**Solution**: Ensure jest.setup.js is loaded

## Future Enhancements

Potential features to add:
1. Compare view (before/after side-by-side)
2. Screenshot capture
3. Contrast checker tool
4. Export report feature
5. Browser extension version
6. More vision impairments (tunnel vision, macular degeneration)

## Getting Help

For AI assistants working on this codebase:
- Read this file first before making changes
- Check test files to understand component behavior
- Maintain accessibility standards
- Keep code simple and documented
- Add tests for new features

