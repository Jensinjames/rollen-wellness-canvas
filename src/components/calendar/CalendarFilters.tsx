
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { useCategories } from "@/hooks/categories";
import { ActivityFilters } from "@/hooks/useActivityFilters";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: Partial<ActivityFilters>) => void;
  onClearFilters: () => void;
}

export function CalendarFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: CalendarFiltersProps) {
  const { data: categories } = useCategories();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const allCategories = categories?.flatMap(cat => [cat, ...(cat.children || [])]) || [];
  const selectedCategories = allCategories.filter(cat => 
    filters.categoryIds.includes(cat.id)
  );

  const handleCategoryToggle = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    
    onFiltersChange({ categoryIds: newCategoryIds });
  };

  const hasActiveFilters = filters.categoryIds.length > 0 || filters.searchTerm;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search activities..."
          value={filters.searchTerm}
          onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Categories
            {filters.categoryIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {filters.categoryIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Filter by Categories</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allCategories.map(category => (
                <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="rounded border-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}

      {/* Active Filter Tags */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(category => (
            <Badge 
              key={category.id} 
              variant="outline"
              className="flex items-center gap-1"
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
              <button
                onClick={() => handleCategoryToggle(category.id)}
                className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
