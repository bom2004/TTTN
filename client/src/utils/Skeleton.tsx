import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

/**
 * Modern Skeleton Loader Component
 * 
 * Uses Tailwind 4 animate-pulse for smooth, professional loading states.
 * Helps prevent Layout Shift (CLS) and improves perceived performance.
 */
const Skeleton: React.FC<SkeletonProps> = ({ className = '', variant = 'rect' }) => {
  const baseClasses = "bg-gray-200 dark:bg-gray-700 animate-pulse";
  
  const variantClasses = {
    rect: "rounded-md",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

export default Skeleton;
