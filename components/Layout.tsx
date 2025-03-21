import React, { ReactNode, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'Alkanes Diesel 监控' }: LayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return router.pathname === path ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-blue-600 hover:text-white';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Alkanes 协议区块浏览器 - 专注Diesel代币监控" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* 导航栏 */}
      <nav className="bg-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link href="/" className="flex items-center">
                  <span className="text-white font-bold text-xl">Alkanes Diesel 监控</span>
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}>
                    Gas 监控
                  </Link>
                  <Link href="/diesel" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/diesel')}`}>
                    Diesel 查询
                  </Link>
                  <Link href="/guide" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/guide')}`}>
                    获取指南
                  </Link>
                  <Link href="/blocks" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/blocks')}`}>
                    区块列表
                  </Link>
                  <Link href="/monitor" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/monitor')}`}>
                    自动交易
                  </Link>
                  <a 
                    href="https://mainnet.sandshrew.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-blue-600 hover:text-white"
                  >
                    区块浏览器
                  </a>
                </div>
              </div>
            </div>
            
            {/* 移动端菜单按钮 */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-blue-700 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-blue-600 focus:outline-none"
                aria-expanded="false"
              >
                <span className="sr-only">打开菜单</span>
                {/* 汉堡图标 */}
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* 关闭图标 */}
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 移动端菜单 */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gas 监控
            </Link>
            <Link href="/diesel" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/diesel')}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Diesel 查询
            </Link>
            <Link href="/guide" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/guide')}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              获取指南
            </Link>
            <Link href="/blocks" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/blocks')}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              区块列表
            </Link>
            <Link href="/monitor" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/monitor')}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              自动交易
            </Link>
            <a 
              href="https://mainnet.sandshrew.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-blue-600 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              区块浏览器
            </a>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="flex-grow">
        {children}
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm">&copy; {new Date().getFullYear()} Alkanes Diesel 监控工具</p>
            </div>
            <div className="mt-4 md:mt-0 flex justify-center md:justify-end space-x-6">
              <p className="text-sm text-gray-400">
                实时监控区块数据，助您获取 Diesel 代币
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 