/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 移除 appDir 选项，它在新版 Next.js 中已经变更
  experimental: {
    // 关闭类型检查
    typedRoutes: false,
  },
  // 保留图像优化配置
  images: {
    unoptimized: true,
  },
  // 这个选项将在未来版本中移除，但可以暂时保留
  // 考虑在将来移除此选项
  swcMinify: false,
  // 关闭 TypeScript 类型检查
  typescript: {
    // !! 警告 !!
    // 禁用类型检查速度更快，但会错过类型错误
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 