import type { NextConfig } from "next";
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/tasks",
        destination: "/requests",
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);

