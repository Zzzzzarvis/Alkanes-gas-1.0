import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function SearchBar() {
  const [query, setQuery] = useState<string>('');
  const router = useRouter();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    // 重定向到搜索结果页面
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  
  return (
    <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索区块、交易、地址或合约..."
          className="w-full p-3 pr-10 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 p-2 text-gray-500 hover:text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
} 