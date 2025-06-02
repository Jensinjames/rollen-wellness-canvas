
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Archive, Trash2, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { CategoryCard } from './CategoryCard';

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

  return (
    <div className="space-y-3">
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
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
          <div className="flex items-center justify-between">
            <Badge variant="secondary">
              {hasChildren ? `${category.children!.length} subcategories` : 'No subcategories'}
            </Badge>
            <Badge variant="default">Parent Category</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Subcategories */}
      {hasChildren && isExpanded && (
        <div className="ml-8 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.children!.map((subcategory) => (
              <div key={subcategory.id} className="relative">
                <div className="absolute -left-6 top-6 w-4 h-px bg-border"></div>
                <div className="absolute -left-6 top-6 w-px h-6 bg-border"></div>
                <CategoryCard
                  category={subcategory}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  activityCount={0} // TODO: Add activity count for subcategories
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
