
import React from 'react';
import { Button } from '@/components/ui/button';

export const SkipToContent: React.FC = () => {
  const handleSkipToContent = () => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
    }
  };

  return (
    <Button
      onClick={handleSkipToContent}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground"
      aria-label="Skip to main content"
    >
      Skip to content
    </Button>
  );
};
