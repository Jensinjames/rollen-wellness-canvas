
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Archive, Trash2, GripVertical, Plus } from 'lucide-react';
import { Category } from '@/hooks/categories';
import { QuickAddSubcategory } from './QuickAddSubcategory';

interface SubcategoryListProps {
  subcategories: Category[];
  onEdit: (category: Category) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (subcategories: Category[]) => void;
  onQuickAdd?: (data: { name: string; color: string; parent_id: string; level: number }) => void;
  parentCategory?: Category;
}

export const SubcategoryList: React.FC<SubcategoryListProps> = ({
  subcategories,
  onEdit,
  onArchive,
  onDelete,
  onReorder,
  onQuickAdd,
  parentCategory,
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleQuickAdd = (data: { name: string; color: string; parent_id: string; level: number }) => {
    if (onQuickAdd) {
      onQuickAdd(data);
      setShowQuickAdd(false);
    }
  };

  if (subcategories.length === 0 && !showQuickAdd) {
    return (
      <div className="text-center py-6">
        <div className="text-muted-foreground mb-3">No subcategories yet</div>
        {parentCategory && onQuickAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickAdd(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add First Subcategory
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subcategories.map((subcategory) => (
        <Card 
          key={subcategory.id} 
          className="relative border-l-4 hover:shadow-md transition-shadow" 
          style={{ borderLeftColor: subcategory.color }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: subcategory.color }}
                />
              </div>
              <CardTitle className="text-base">
                {subcategory.name}
              </CardTitle>
              {/* Show color inheritance indicator */}
              {parentCategory && subcategory.color === parentCategory.color && (
                <Badge variant="outline" className="text-xs ml-2">
                  Inherited
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border shadow-lg z-50">
                <DropdownMenuItem onClick={() => onEdit(subcategory)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Subcategory
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(subcategory.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(subcategory.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-0 pl-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {subcategory.daily_time_goal_minutes && (
                  <Badge variant="outline" className="text-xs">
                    Daily: {subcategory.daily_time_goal_minutes}m
                  </Badge>
                )}
                {subcategory.weekly_time_goal_minutes && (
                  <Badge variant="outline" className="text-xs">
                    Weekly: {Math.floor(subcategory.weekly_time_goal_minutes / 60)}h {subcategory.weekly_time_goal_minutes % 60}m
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                0 activities
              </Badge>
            </div>
            {subcategory.description && (
              <p className="text-sm text-muted-foreground">
                {subcategory.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {showQuickAdd && parentCategory && onQuickAdd ? (
        <QuickAddSubcategory
          parentCategory={parentCategory}
          onAdd={handleQuickAdd}
          onCancel={() => setShowQuickAdd(false)}
        />
      ) : (
        parentCategory && onQuickAdd && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickAdd(true)}
            className="w-full border-dashed"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Subcategory
          </Button>
        )
      )}
    </div>
  );
};
