/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 明确指定使用Pages Router
  experimental: {
    appDir: false,
  },
  // 禁用图像优化防止相关问题
  images: {
    unoptimized: true,
  },
  // 确保正确编译
  swcMinify: false,
}

module.exports = nextConfig 