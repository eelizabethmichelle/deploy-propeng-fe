/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
  },
   async rewrites() {
    return [
      {
        source: "/api/:path*", // Semua request ke /api/...
        destination: "http://127.0.0.1:8000/api/:path*", // Diteruskan ke backend HTTP
      },
    ];
  },
  };
  
  module.exports = nextConfig;