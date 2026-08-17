/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  experimental: {
    authInterrupts: true,
  },
  async rewrites() {
    const apiBaseUrl = process.env.API_PROXY_BASE_URL ?? 'http://localhost:3001'
    return [{ source: '/api/v1/:path*', destination: `${apiBaseUrl}/api/v1/:path*` }]
  },
}

export default nextConfig
