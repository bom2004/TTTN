import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="flex flex-col items-center">
        {/* Skeleton-like Spinner using Tailwind 4 animate-pulse */}
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse dark:text-gray-400">
          Đang tải trải nghiệm của bạn...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
