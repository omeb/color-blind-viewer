# Contributing to Colorblind Viewer

Thank you for your interest in contributing! This project aims to promote web accessibility awareness.

## How to Contribute

### Reporting Issues

Found a bug or have a feature request?

1. Check if the issue already exists in [GitHub Issues](https://github.com/omeb/color-blind-viewer/issues)
2. If not, create a new issue with:
   - Clear title
   - Detailed description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if relevant

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/color-blind-viewer.git
   cd color-blind-viewer
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Follow the [Code Style Guide](docs/CODE_STYLE.md)
   - Write tests for new features
   - Update documentation

4. **Test your changes**
   ```bash
   npm test          # Unit tests
   npm run test:e2e  # E2E tests
   npm run build     # Ensure it builds
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new vision impairment filter"
   ```
   
   Use [conventional commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Code style (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

## Development Setup

```bash
# Clone and install
git clone https://github.com/omeb/color-blind-viewer.git
cd color-blind-viewer
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

See [docs/MAINTAINABILITY.md](docs/MAINTAINABILITY.md) for detailed architecture.

```
app/
├── api/proxy/         # Proxy API for fetching websites
├── components/        # React components
├── lib/              # Utility functions
├── page.js           # Main page
└── globals.css       # Styles
```

## Coding Standards

### JavaScript/JSX

- Use functional components with hooks
- Add JSDoc comments for functions
- Follow existing code patterns
- Use meaningful variable names

### Testing

- Write tests for all new features
- Aim for 80%+ code coverage
- Test accessibility features
- Use descriptive test names

### Accessibility

**This project is about accessibility, so it MUST be accessible!**

- Maintain WCAG AA compliance
- Test with keyboard navigation
- Add ARIA labels where needed
- Use semantic HTML
- Ensure color contrast meets standards

### Styling

- Use CSS-in-JS (styled-jsx)
- Follow glassmorphism design pattern
- Ensure responsive design
- Support reduced motion preference

## Ideas for Contributions

### Easy (Good First Issues)

- [ ] Add more example URLs to try
- [ ] Improve error messages
- [ ] Add loading animations
- [ ] Fix typos in documentation
- [ ] Add more design tips to InfoPanel

### Medium

- [ ] Add more vision impairment filters
- [ ] Implement side-by-side comparison view
- [ ] Add screenshot upload feature
- [ ] Improve mobile responsive design
- [ ] Add keyboard shortcuts

### Advanced

- [ ] Create browser extension version
- [ ] Add PDF report export
- [ ] Implement contrast checker tool
- [ ] Add real-time video filter
- [ ] Build API for external use

## Testing Guidelines

### Unit Tests

```javascript
// Component test example
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### E2E Tests

```javascript
// E2E test example
test('user can load a website', async ({ page }) => {
  await page.goto('/')
  await page.fill('[aria-label="Website URL"]', 'example.com')
  await page.click('button:text("Load Website")')
  // Assert website loaded
})
```

## Documentation

When adding features, update:
- [ ] README.md (user-facing)
- [ ] docs/MAINTAINABILITY.md (technical details)
- [ ] Inline code comments
- [ ] Test documentation

## Getting Help

- **Questions**: [GitHub Discussions](https://github.com/omeb/color-blind-viewer/discussions)
- **Issues**: [GitHub Issues](https://github.com/omeb/color-blind-viewer/issues)
- **Documentation**: See `/docs` folder

## Code Review Process

1. Automated checks must pass:
   - Tests
   - Linting
   - Build

2. Manual review by maintainer:
   - Code quality
   - Accessibility
   - Documentation

3. Merge when approved

## Community Guidelines

- Be respectful and inclusive
- Help others learn
- Focus on constructive feedback
- Celebrate contributions of all sizes

## Recognition

Contributors will be:
- Listed in project acknowledgments
- Mentioned in release notes
- Given credit in commit history

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making the web more accessible! 🌈

