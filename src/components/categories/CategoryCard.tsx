import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Archive, Trash2 } from 'lucide-react';
import { Category } from '@/hooks/categories';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  activityCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onArchive,
  onDelete,
  activityCount = 0,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
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
            {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
          </Badge>
          {category.is_active ? (
            <Badge variant="default">Active</Badge>
          ) : (
            <Badge variant="outline">Archived</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
