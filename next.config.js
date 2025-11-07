/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images (though we might not use next/image for proxied content)
  images: {
    domains: [],
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Compression is good
  compress: true,
}

module.exports = nextConfig

