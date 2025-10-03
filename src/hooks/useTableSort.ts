import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState<T = string> {
  column: T | null;
  direction: SortDirection;
}

export interface UseTableSortProps<T, K extends keyof T> {
  data: T[];
  initialSortColumn?: K;
  initialSortDirection?: Exclude<SortDirection, 'none'>;
}

export interface UseTableSortReturn<T, K extends keyof T> {
  sortedData: T[];
  sortState: SortState<K>;
  handleSort: (column: K) => void;
  getSortProps: (column: K) => {
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    'aria-sort': 'ascending' | 'descending' | 'none';
    role: 'button';
    tabIndex: 0;
  };
}

export function useTableSort<T, K extends keyof T>({
  data,
  initialSortColumn,
  initialSortDirection = 'asc'
}: UseTableSortProps<T, K>): UseTableSortReturn<T, K> {
  const [sortState, setSortState] = useState<SortState<K>>({
    column: initialSortColumn || null,
    direction: initialSortColumn ? initialSortDirection : 'none'
  });

  const handleSort = useCallback((column: K) => {
    setSortState(prev => {
      if (prev.column !== column) {
        return { column, direction: 'asc' };
      }

      if (prev.direction === 'asc') {
        return { column, direction: 'desc' };
      }

      return { column: null, direction: 'none' };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.column || sortState.direction === 'none') {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortState.column!];
      const bValue = b[sortState.column!];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState]);

  const getSortProps = useCallback((column: K) => {
    const isActive = sortState.column === column;
    const ariaSortValue = isActive
      ? (sortState.direction === 'asc' ? 'ascending' : 'descending')
      : 'none';

    return {
      onClick: () => handleSort(column),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(column);
        }
      },
      'aria-sort': ariaSortValue as 'ascending' | 'descending' | 'none',
      role: 'button' as const,
      tabIndex: 0
    };
  }, [sortState, handleSort]);

  return {
    sortedData,
    sortState,
    handleSort,
    getSortProps
  };
}
