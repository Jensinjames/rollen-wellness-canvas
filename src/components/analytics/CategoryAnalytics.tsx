
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/useCategories";
import { useMemo } from "react";

export function CategoryAnalytics() {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();

  const categoryStats = useMemo(() => {
    if (!activities || !categories) return [];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const weekActivities = activities.filter(activity => 
      new Date(activity.date_time) >= weekStart
    );

    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);

    return flatCategories.map(category => {
      const categoryActivities = weekActivities.filter(activity => 
        activity.category_id === category.id
      );

      const totalTime = categoryActivities.reduce((sum, activity) => 
        sum + activity.duration_minutes, 0
      );

      const goalTime = category.weekly_time_goal_minutes || 0;
      const completionRate = goalTime > 0 ? Math.min((totalTime / goalTime) * 100, 100) : 0;

      return {
        ...category,
        totalTime,
        goalTime,
        completionRate,
        activitiesCount: categoryActivities.length
      };
    }).filter(cat => cat.totalTime > 0 || cat.goalTime > 0)
     .sort((a, b) => b.totalTime - a.totalTime);
  }, [activities, categories]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Performance (This Week)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryStats.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No activity data available for this week.
            </p>
          ) : (
            categoryStats.map((category, index) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {Math.round(category.totalTime / 60 * 10) / 10}h logged
                        {category.goalTime > 0 && (
                          <span> / {Math.round(category.goalTime / 60 * 10) / 10}h goal</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {category.activitiesCount} activities
                    </div>
                    {category.goalTime > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {Math.round(category.completionRate)}% complete
                      </div>
                    )}
                  </div>
                </div>
                
                {category.goalTime > 0 && (
                  <Progress 
                    value={category.completionRate}
                    className="h-2"
                    style={{
                      backgroundColor: `${category.color}20`,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
