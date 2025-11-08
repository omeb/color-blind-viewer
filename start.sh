#!/bin/bash

# Colorblind Viewer - Quick Start Script
# This script helps you get the project running quickly

set -e  # Exit on error

echo "🎨 Colorblind Viewer - Quick Start"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js 18+ required. You have: $(node -v)"
    echo "   Please upgrade Node.js"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
else
    echo "✅ Dependencies already installed"
    echo ""
fi

# Display next steps
echo "🚀 Ready to go! Here are your options:"
echo ""
echo "1. Start development server:"
echo "   npm run dev"
echo "   Then open: http://localhost:3000"
echo ""
echo "2. Run tests:"
echo "   npm test"
echo ""
echo "3. Build for production:"
echo "   npm run build"
echo "   npm start"
echo ""
echo "4. Deploy to Netlify:"
echo "   npm install -g netlify-cli"
echo "   netlify deploy --prod"
echo ""
echo "📚 For more info, see:"
echo "   - README.md"
echo "   - docs/DEPLOYMENT.md"
echo ""
echo "Happy testing! 🎨"

