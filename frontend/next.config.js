/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8080/api/:path*'
          : `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/:path*`
      }
    ]
  },
  // Ignore punycode warning
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        punycode: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
