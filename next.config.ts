import type { NextConfig } from 'next';

const API_BACKEND_URL = process.env.API_BACKEND_URL || 'http://198.23.196.164:8080/v1';

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_BACKEND_URL}/:path*`,
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true, // 忽略 eslint 检查
  },
  typescript: {
    ignoreBuildErrors: true, // 忽略 TypeScript 检查
  },
  reactStrictMode: true,
  transpilePackages: [
    '@ant-design',
    'antd',
    'rc-util',
    'rc-pagination',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-input',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
       {
        protocol: 'https',
        hostname: 'file-cdn.openbuild.xyz',
         pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
