# Colorblind Viewer 👁️

> Experience the web through the eyes of people with vision impairments

A modern web application that helps developers understand how their websites appear to users with various vision impairments. Test your designs for accessibility and create more inclusive web experiences.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)

## 🌟 Features

- **Real-time Vision Simulation**: See any website through different vision impairments
- **Multiple Filter Types**:
  - Protanopia (red-blind)
  - Deuteranopia (green-blind)
  - Tritanopia (blue-blind)
  - Achromatopsia (complete colorblindness)
  - Cataracts
  - Low vision
  - Low contrast sensitivity
- **Educational Info**: Learn about each vision impairment with statistics and impact
- **Glassmorphism UI**: Modern, clean design with accessibility first
- **Fully Accessible**: WCAG AA compliant, keyboard navigable, screen reader friendly
- **No Signup Required**: Just enter a URL and start testing

## 🎯 Why This Matters

- **300 million** people worldwide have color vision deficiency
- **1 in 12 males** have some form of colorblindness
- **2.2 billion** people have a vision impairment globally
- **90%** of websites have accessibility barriers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/omeb/color-blind-viewer.git
cd color-blind-viewer

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Enter a Website URL**: Type or paste any website URL in the input field
2. **Click Load Website**: The site will load in the viewer
3. **Select a Filter**: Click any vision impairment button to apply the filter
4. **Toggle Filter**: Click the same button or "Clear Filter" to remove the effect
5. **Learn More**: Expand the info panel to learn about each impairment

### Example URLs to Try

- `wix.com`
- `github.com`
- `apple.com`
- `wikipedia.org`

**Note**: Some websites block iframe embedding for security reasons. If a site doesn't load, try a different one.

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests in CI mode
npm run test:ci

# Run E2E tests
npm run test:e2e
```

## 📦 Build for Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Click "Deploy"

Done! Vercel will auto-deploy on every push to main.

### Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Other Platforms

This is a standard Next.js app and can be deployed to:
- Netlify
- AWS Amplify
- Google Cloud Run
- Docker container

## 🏗️ Project Structure

```
/
├── app/
│   ├── page.js              # Main page
│   ├── layout.js            # Root layout
│   ├── globals.css          # Global styles
│   ├── api/
│   │   └── proxy/
│   │       └── route.js     # Proxy API endpoint
│   ├── components/          # React components
│   │   ├── UrlInput.jsx
│   │   ├── WebsiteViewer.jsx
│   │   ├── ImpairmentControls.jsx
│   │   └── InfoPanel.jsx
│   └── lib/
│       └── filters.js       # Vision impairment filters
├── e2e/                     # E2E tests
├── docs/                    # Documentation
├── public/                  # Static assets
└── package.json
```

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: CSS-in-JS (styled-jsx)
- **Testing**: Jest + React Testing Library + Playwright
- **Deployment**: Vercel

## 🎨 Design Philosophy

- **Accessibility First**: WCAG AA compliant, keyboard navigable
- **Glassmorphism**: Modern frosted glass design
- **Performance**: Optimized for fast loading
- **Simplicity**: Clean, intuitive interface

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure accessibility standards are maintained

See [docs/CODE_STYLE.md](docs/CODE_STYLE.md) for detailed guidelines.

## 📚 Documentation

- [Maintainability Guide](docs/MAINTAINABILITY.md) - For AI assistants and developers
- [Code Style Guide](docs/CODE_STYLE.md) - Coding standards and best practices

## 🔒 Privacy & Security

- No user data is collected or stored
- No analytics or tracking
- All processing happens in your browser
- Proxy requests are not logged

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Color vision deficiency simulation based on research by Brettel, Viénot, Mollon, and Machado
- Built to promote web accessibility and inclusive design
- Inspired by the Web Content Accessibility Guidelines (WCAG)

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/omeb/color-blind-viewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/omeb/color-blind-viewer/discussions)

## 🌐 Resources

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Color Blind Awareness](https://www.colourblindawareness.org/)

---

Made with ❤️ for a more accessible web

