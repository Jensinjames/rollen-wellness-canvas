
import { useState } from "react";

export interface ActivityFilters {
  categoryIds: string[];
  subcategoryIds: string[];
  searchTerm: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export const useActivityFilters = () => {
  const [filters, setFilters] = useState<ActivityFilters>({
    categoryIds: [],
    subcategoryIds: [],
    searchTerm: "",
  });

  const updateFilters = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      categoryIds: [],
      subcategoryIds: [],
      searchTerm: "",
    });
  };

  return {
    filters,
    updateFilters,
    clearFilters,
  };
};
