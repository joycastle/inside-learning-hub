import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['127.0.0.1'],
  devIndicators: false,
  experimental: {
    authInterrupts: true,
  },
}

export default withPayload(nextConfig)
