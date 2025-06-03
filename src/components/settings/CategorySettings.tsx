import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCategories, useDeleteCategory, Category } from "@/hooks/categories";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { CategoryForm } from "@/components/categories/CategoryForm";

export const CategorySettings = () => {
  const { data: categories, isLoading } = useCategories();
  const deleteCategoryMutation = useDeleteCategory();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all subcategories and associated activities.`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  const topLevelCategories = categories?.filter(cat => cat.level === 0) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Category Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your personal activity categories and subcategories.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4">
        {topLevelCategories.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {category.daily_time_goal_minutes && (
                  <Badge variant="secondary">
                    Daily: {category.daily_time_goal_minutes}m
                  </Badge>
                )}
                {category.weekly_time_goal_minutes && (
                  <Badge variant="secondary">
                    Weekly: {category.weekly_time_goal_minutes}m
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteCategory(category.id, category.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Subcategories */}
            {categories?.filter(cat => cat.parent_id === category.id).length > 0 && (
              <div className="mt-3 ml-7 space-y-2">
                {categories
                  ?.filter(cat => cat.parent_id === category.id)
                  .map((subcategory) => (
                    <div key={subcategory.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subcategory.color }}
                        />
                        <span>{subcategory.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {subcategory.daily_time_goal_minutes && (
                          <Badge variant="outline" className="text-xs">
                            {subcategory.daily_time_goal_minutes}m
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(subcategory)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCategory(subcategory.id, subcategory.name)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <CategoryForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={() => {}} // This will be handled by the form's own logic
        category={editingCategory}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      />
    </div>
  );
};
