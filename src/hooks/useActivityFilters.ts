
import { useState } from "react";
import { ActivityFilters } from "@/types/activity";

// Re-export for backward compatibility
export type { ActivityFilters };


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
