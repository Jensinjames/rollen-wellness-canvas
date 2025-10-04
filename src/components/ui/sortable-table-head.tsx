import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from './table';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/hooks/useTableSort';

interface SortableTableHeadProps {
  sortDirection?: SortDirection;
  onSort?: () => void;
  sortable?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const SortableTableHead = React.forwardRef<HTMLTableCellElement, SortableTableHeadProps>(
  ({ sortDirection = 'none', onSort, sortable = true, children, className }, ref) => {
    const getSortIcon = () => {
      if (!sortable) return null;

      if (sortDirection === 'asc') {
        return <ArrowUp className="ml-2 h-4 w-4" aria-hidden="true" />;
      }
      if (sortDirection === 'desc') {
        return <ArrowDown className="ml-2 h-4 w-4" aria-hidden="true" />;
      }
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" aria-hidden="true" />;
    };

    const getSortLabel = () => {
      if (sortDirection === 'asc') return 'sorted ascending';
      if (sortDirection === 'desc') return 'sorted descending';
      return 'not sorted';
    };

    if (!sortable) {
      return (
        <TableHead ref={ref} className={className}>
          {children}
        </TableHead>
      );
    }

    return (
      <TableHead ref={ref} className={className}>
        <div
          onClick={onSort}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSort?.();
            }
          }}
          tabIndex={0}
          role="button"
          className={cn(
            'flex items-center cursor-pointer select-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded'
          )}
          aria-label={`${children} - ${getSortLabel()}, click to sort`}
        >
          <span>{children}</span>
          {getSortIcon()}
        </div>
      </TableHead>
    );
  }
);

SortableTableHead.displayName = 'SortableTableHead';
