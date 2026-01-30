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
    }
}

module.exports = nextConfig
