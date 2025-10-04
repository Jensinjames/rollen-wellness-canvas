import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface SortState<K extends string> {
  column: K | null;
  direction: SortDirection;
}

export interface UseTableSortReturn<T, K extends string> {
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

export function useTableSort<T, K extends string>(
  data: T[],
  getSortValue: (item: T, column: K) => any,
  initialColumn?: K,
  initialDirection: SortDirection = 'none'
): UseTableSortReturn<T, K> {
  const [sortState, setSortState] = useState<SortState<K>>({
    column: initialColumn || null,
    direction: initialDirection,
  });

  const handleSort = useCallback((column: K) => {
    setSortState(prev => {
      if (prev.column !== column) {
        return { column, direction: 'asc' };
      }
      
      const directionMap: Record<SortDirection, SortDirection> = {
        'none': 'asc',
        'asc': 'desc',
        'desc': 'none',
      };
      
      return {
        column: directionMap[prev.direction] === 'none' ? null : column,
        direction: directionMap[prev.direction],
      };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortState.column || sortState.direction === 'none') {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getSortValue(a, sortState.column!);
      const bValue = getSortValue(b, sortState.column!);

      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState, getSortValue]);

  const getSortDirection = useCallback((column: K): 'ascending' | 'descending' | 'none' => {
    if (sortState.column !== column) return 'none';
    if (sortState.direction === 'asc') return 'ascending';
    if (sortState.direction === 'desc') return 'descending';
    return 'none';
  }, [sortState]);

  const getSortProps = useCallback((column: K) => {
    return {
      onClick: () => handleSort(column),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort(column);
        }
      },
      'aria-sort': getSortDirection(column),
      role: 'button' as const,
      tabIndex: 0 as const
    };
  }, [sortState, handleSort, getSortDirection]);

  return {
    sortedData,
    sortState,
    handleSort,
    getSortProps
  };
}
