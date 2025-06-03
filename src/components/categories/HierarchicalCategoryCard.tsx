
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Archive, Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Category, useCreateCategory } from '@/hooks/useCategories';
import { CategoryCard } from './CategoryCard';
import { SubcategoryList } from './SubcategoryList';

interface HierarchicalCategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubcategory: (parentCategory: Category) => void;
  activityCount?: number;
}

export const HierarchicalCategoryCard: React.FC<HierarchicalCategoryCardProps> = ({
  category,
  onEdit,
  onArchive,
  onDelete,
  onAddSubcategory,
  activityCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const createCategoryMutation = useCreateCategory();
  
  const hasChildren = category.children && category.children.length > 0;

  if (category.level === 1) {
    // Render subcategory as a simple card
    return (
      <CategoryCard
        category={category}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
        activityCount={activityCount}
      />
    );
  }

  const handleQuickAddSubcategory = (data: { name: string; color: string; parent_id: string; level: number }) => {
    createCategoryMutation.mutate({
      name: data.name,
      color: data.color,
      description: '',
      is_active: true,
      sort_order: category.children?.length || 0,
      parent_id: data.parent_id,
      level: data.level,
      daily_time_goal_minutes: undefined,
      weekly_time_goal_minutes: undefined,
    });
  };

  return (
    <div className="space-y-4">
      {/* Parent Category Card */}
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-3">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border shadow-lg z-50">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSubcategory(category)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(category.id)}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(category.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {category.description && (
            <CardDescription className="mb-3">
              {category.description}
            </CardDescription>
          )}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {category.daily_time_goal_minutes && (
                <Badge variant="outline">
                  Daily: {category.daily_time_goal_minutes}m
                </Badge>
              )}
              {category.weekly_time_goal_minutes && (
                <Badge variant="outline">
                  Weekly: {Math.floor(category.weekly_time_goal_minutes / 60)}h {category.weekly_time_goal_minutes % 60}m
                </Badge>
              )}
            </div>
            <Badge variant="default">Parent Category</Badge>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {hasChildren ? `${category.children!.length} subcategories` : 'No subcategories'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddSubcategory(category)}
              className="text-xs"
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Subcategory
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subcategories */}
      {isExpanded && (
        <div className="ml-6 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-px bg-border"></div>
            <h4 className="text-sm font-medium text-muted-foreground">Subcategories</h4>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <SubcategoryList
            subcategories={category.children || []}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
            onQuickAdd={handleQuickAddSubcategory}
            parentCategory={category}
          />
        </div>
      )}
    </div>
  );
};
