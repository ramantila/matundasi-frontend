/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8065';

const nextConfig = {
    // The backend has no CORS config, so the browser talks to Next.js and Next.js forwards /api/* to Spring Boot.
    async rewrites() {
        return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
    },
};

export default nextConfig;
