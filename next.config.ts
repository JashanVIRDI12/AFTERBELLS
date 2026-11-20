import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      { pathname: '/media/**' },
      { pathname: '/**', search: '' },
    ],
    qualities: [75, 85, 92],
    formats: ['image/avif', 'image/webp'],
  },
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // preorder has closed for now: send old links to the collection (temporary, in case it returns)
  async redirects() {
    return [{ source: '/preorder', destination: '/collection', permanent: false }]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
