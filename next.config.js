/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "strapi.npi.msk.ru",
      },
    ],
  },
};

module.exports = nextConfig;
