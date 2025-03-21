import React from 'react';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">页面未找到</h2>
        <p className="text-gray-600 mb-8">
          您请求的页面不存在或已被移除。
        </p>
        <Link 
          href="/" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
} 