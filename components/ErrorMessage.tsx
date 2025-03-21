import React from 'react';

interface ErrorMessageProps {
  message: string;
  retry?: () => void;
  goBack?: boolean;
  className?: string;
}

export default function ErrorMessage({ 
  message, 
  retry, 
  goBack = false,
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 text-center ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-10 w-10 text-red-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">发生错误</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        {retry && (
          <button
            onClick={retry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        )}
        
        {goBack && (
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            返回
          </button>
        )}
      </div>
    </div>
  );
} 