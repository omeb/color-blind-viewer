# Code Style Guide

## General Principles
1. **Simplicity Over Cleverness**: Write obvious code, not clever code
2. **Consistency**: Follow established patterns in the codebase
3. **Accessibility First**: Every feature must be accessible
4. **Test Everything**: No feature without tests

## JavaScript/JSX

### Component Structure
```javascript
'use client' // Only if needed (client components)

import React from 'react'

/**
 * Brief description of component
 * @param {Object} props - Component props
 * @param {string} props.example - Example prop
 */
export default function ComponentName({ example }) {
  // Hooks first
  const [state, setState] = React.useState()
  
  // Event handlers
  const handleEvent = () => {
    // ...
  }
  
  // Render
  return (
    <div>
      {/* Content */}
    </div>
  )
}
```

### Naming Conventions
- **Components**: PascalCase (e.g., `UrlInput`)
- **Files**: Match component name (e.g., `UrlInput.jsx`)
- **Functions**: camelCase (e.g., `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)
- **CSS Classes**: kebab-case (e.g., `glass-card`)

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities
5. Styles

### Comments
- Use JSDoc for functions/components
- Explain "why", not "what"
- Add TODO comments with context

```javascript
// ✅ Good
// Using debounce to avoid excessive API calls during typing
const debouncedSearch = debounce(search, 300)

// ❌ Bad
// Debounce the search function
const debouncedSearch = debounce(search, 300)
```

## CSS

### Structure
1. Layout properties (display, position, etc.)
2. Box model (width, height, padding, margin)
3. Visual (background, border, etc.)
4. Typography
5. Transitions/Animations

### Glassmorphism Pattern
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Accessibility Rules
- Minimum contrast 4.5:1 for text
- Focus states for all interactive elements
- No content only in color
- Respect prefers-reduced-motion

```css
/* Focus states */
button:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing

### Test File Structure
```javascript
import { render, screen } from '@testing-library/react'
import ComponentName from './ComponentName'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  
  it('handles user interaction', async () => {
    // Test implementation
  })
})
```

### Test Naming
- Describe what the component/function does
- Use clear, complete sentences
- Group related tests with `describe`

### What to Test
1. **Component Rendering**: Does it render without errors?
2. **User Interactions**: Do buttons, inputs work?
3. **Accessibility**: Proper ARIA, keyboard navigation
4. **Edge Cases**: Empty states, errors, loading

### What Not to Test
- Implementation details
- Third-party libraries
- Styling specifics (unless critical to functionality)

## Git

### Commit Messages
Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

Examples:
```
feat: add deuteranopia filter
fix: correct contrast ratio on glass cards
docs: update installation instructions
test: add unit tests for UrlInput component
```

### Branch Names (if using)
- `feature/description`
- `fix/description`
- `docs/description`

## API Routes

### Route Structure
```javascript
export async function GET(request) {
  try {
    // Validate input
    const url = request.nextUrl.searchParams.get('url')
    if (!url) {
      return Response.json({ error: 'URL required' }, { status: 400 })
    }
    
    // Process
    const result = await fetchData(url)
    
    // Return
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Error Handling
- Always validate input
- Return appropriate status codes
- Don't expose sensitive error details
- Log errors for debugging

## Documentation

### When to Add Documentation
- New components: JSDoc comments
- Complex logic: Inline comments
- New features: Update MAINTAINABILITY.md
- API changes: Update README.md

### README Updates
Keep these sections current:
- Features list
- Installation steps
- Usage examples
- Deployment instructions

## Performance

### Best Practices
- Use React.memo for expensive components
- Lazy load heavy components
- Optimize images in /public
- Minimize bundle size

### No Premature Optimization
- Write clean code first
- Optimize when needed (based on metrics)
- Document optimization reasons

## Accessibility Checklist

Before committing:
- [ ] Keyboard navigable?
- [ ] Screen reader tested?
- [ ] Color contrast checked?
- [ ] Focus states visible?
- [ ] ARIA labels added?
- [ ] Semantic HTML used?
- [ ] No motion for prefers-reduced-motion?

## Code Review Checklist

- [ ] Code is simple and readable
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.logs left
- [ ] Accessibility maintained
- [ ] No linting errors
- [ ] Works on mobile

