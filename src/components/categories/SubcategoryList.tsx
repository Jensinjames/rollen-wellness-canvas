
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Archive, Trash2, Check, X, GripVertical } from 'lucide-react';
import { Category } from '@/hooks/useCategories';

interface SubcategoryListProps {
  subcategories: Category[];
  onEdit: (category: Category) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (subcategories: Category[]) => void;
}

export const SubcategoryList: React.FC<SubcategoryListProps> = ({
  subcategories,
  onEdit,
  onArchive,
  onDelete,
  onReorder,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleStartEdit = (subcategory: Category) => {
    setEditingId(subcategory.id);
    setEditingName(subcategory.name);
  };

  const handleSaveEdit = (subcategory: Category) => {
    if (editingName.trim()) {
      onEdit({ ...subcategory, name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (subcategories.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No subcategories yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subcategories.map((subcategory, index) => (
        <Card key={subcategory.id} className="relative border-l-4" style={{ borderLeftColor: subcategory.color }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: subcategory.color }}
                />
              </div>
              {editingId === subcategory.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(subcategory);
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSaveEdit(subcategory)}
                    className="h-8 w-8 p-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <CardTitle 
                  className="text-base cursor-pointer hover:text-muted-foreground"
                  onClick={() => handleStartEdit(subcategory)}
                >
                  {subcategory.name}
                </CardTitle>
              )}
            </div>
            {editingId !== subcategory.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(subcategory)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Details
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
            )}
          </CardHeader>
          <CardContent className="pt-0 pl-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
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
              <p className="text-sm text-muted-foreground mt-2">
                {subcategory.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
