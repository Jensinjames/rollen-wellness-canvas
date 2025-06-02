
import { useState } from "react";

export interface ActivityFilters {
  categoryIds: string[];
  searchTerm: string;
}

export const useActivityFilters = () => {
  const [filters, setFilters] = useState<ActivityFilters>({
    categoryIds: [],
    searchTerm: "",
  });

  const updateFilters = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      categoryIds: [],
      searchTerm: "",
    });
  };

  return {
    filters,
    updateFilters,
    clearFilters,
  };
};
