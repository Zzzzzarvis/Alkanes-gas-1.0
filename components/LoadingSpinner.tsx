import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message = '加载中...',
  fullPage = false,
  className = ''
}: LoadingSpinnerProps) {
  // 计算尺寸
  const spinnerSize = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }[size];
  
  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${spinnerSize} text-blue-600 animate-spin`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
      {message && (
        <p className="mt-3 text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
  
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }
  
  return content;
} 