/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true
    },
    images: {
        unoptimized: true
    },
    experimental: {
        // Enable any Next.js 14 experimental features if needed
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // Security headers
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()'
                    }
                ]
            },
            {
                source: '/api/:path*',
                headers: [
                    // CORS headers for API routes
                    {
                        key: 'Access-Control-Allow-Origin',
                        value: process.env.NEXT_PUBLIC_SITE_URL || '*'
                    },
                    {
                        key: 'Access-Control-Allow-Methods',
                        value: 'GET, POST, OPTIONS'
                    },
                    {
                        key: 'Access-Control-Allow-Headers',
                        value: 'Content-Type, Authorization'
                    },
                    {
                        key: 'Access-Control-Max-Age',
                        value: '86400'
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
