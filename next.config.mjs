/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Enable SWC minification
  swcMinify: true,
};

export default nextConfig;
