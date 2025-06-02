
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/useCategories";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Archive } from "lucide-react";

export const CategorySettings = () => {
  const { data: categories, isLoading } = useCategories();

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
            Manage your activity categories and subcategories.
          </p>
        </div>
        <Button>
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
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Archive className="h-4 w-4" />
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
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
