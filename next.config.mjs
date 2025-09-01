/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: ''
      }
    ]
  },
  eslint: {
    ignoreDuringBuilds: true, // 🚀 disables ESLint errors from breaking your build
  },
};

export default nextConfig;
