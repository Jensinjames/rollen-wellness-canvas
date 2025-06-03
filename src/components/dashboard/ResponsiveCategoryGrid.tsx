
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ResponsiveCategoryGridProps {
  title: string;
  children: React.ReactNode;
  onQuickAdd?: () => void;
  className?: string;
}

export const ResponsiveCategoryGrid: React.FC<ResponsiveCategoryGridProps> = ({
  title,
  children,
  onQuickAdd,
  className = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {onQuickAdd && (
          <Button 
            onClick={onQuickAdd}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>
        )}
      </div>
      
      {/* Desktop: Standard Grid */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {children}
      </div>
      
      {/* Mobile/Tablet: Horizontal Scroll */}
      <div className="lg:hidden">
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
            {React.Children.map(children, (child, index) => (
              <div key={index} className="w-80 flex-shrink-0">
                {child}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
