/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
  },
   async rewrites() {
    return [
      {
        source: "/api/:path*", // Semua request ke /api/...
        destination: "http://203.194.113.127/api/:path*", // Diteruskan ke backend HTTP
      },
    ];
  },
  };
  
  module.exports = nextConfig;