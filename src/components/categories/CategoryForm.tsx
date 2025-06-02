
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Category, useParentCategories } from '@/hooks/useCategories';
import { ChevronRight } from 'lucide-react';

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'path' | 'children'>) => void;
  category?: Category;
  title: string;
}

const colorOptions = [
  '#10B981', // Green (Faith)
  '#F59E0B', // Yellow (Life)
  '#EF4444', // Red (Work)
  '#EC4899', // Pink (Health)
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

export const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  title,
}) => {
  const { data: parentCategories } = useParentCategories();
  
  const [formData, setFormData] = useState({
    name: category?.name || '',
    color: category?.color || colorOptions[0],
    description: category?.description || '',
    is_active: category?.is_active ?? true,
    sort_order: category?.sort_order || 0,
    parent_id: category?.parent_id || '',
    level: category?.level || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Set level based on parent selection
    const level = formData.parent_id ? 1 : 0;

    onSubmit({
      ...formData,
      parent_id: formData.parent_id || undefined,
      level,
    });
    
    setFormData({
      name: '',
      color: colorOptions[0],
      description: '',
      is_active: true,
      sort_order: 0,
      parent_id: '',
      level: 0,
    });
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: category?.name || '',
      color: category?.color || colorOptions[0],
      description: category?.description || '',
      is_active: category?.is_active ?? true,
      sort_order: category?.sort_order || 0,
      parent_id: category?.parent_id || '',
      level: category?.level || 0,
    });
    onClose();
  };

  const isSubcategory = formData.parent_id !== '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {category ? 'Update your category details.' : 'Create a new category to organize your activities.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parent">Category Type</Label>
            <Select
              value={formData.parent_id}
              onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Top-level Category</SelectItem>
                {parentCategories?.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: parent.color }}
                      />
                      <span>{parent.name}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span className="text-muted-foreground">Subcategory</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {isSubcategory ? 'Subcategory' : 'Category'} Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`Enter ${isSubcategory ? 'subcategory' : 'category'} name`}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-900 dark:border-gray-100' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={`Brief description of this ${isSubcategory ? 'subcategory' : 'category'}`}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
