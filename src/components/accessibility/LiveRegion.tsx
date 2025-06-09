
import React from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ 
  message, 
  politeness = 'polite',
  className = 'sr-only'
}) => {
  return (
    <div 
      aria-live={politeness}
      aria-atomic="true"
      className={className}
    >
      {message}
    </div>
  );
};
