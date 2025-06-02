
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Target, TrendingUp, Calendar } from "lucide-react";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/useCategories";
import { useMemo } from "react";

export function AnalyticsSummary() {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();

  const analytics = useMemo(() => {
    if (!activities || !categories) {
      return {
        totalTimeThisWeek: 0,
        goalCompletionRate: 0,
        activeStreaks: 0,
        categoriesTracked: 0
      };
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const weekActivities = activities.filter(activity => 
      new Date(activity.date_time) >= weekStart
    );

    const totalTimeThisWeek = weekActivities.reduce((sum, activity) => 
      sum + activity.duration_minutes, 0
    );

    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    const categoriesWithGoals = flatCategories.filter(cat => 
      cat.daily_time_goal_minutes || cat.weekly_time_goal_minutes
    );

    let completedGoals = 0;
    categoriesWithGoals.forEach(category => {
      const categoryActivities = weekActivities.filter(activity => 
        activity.category_id === category.id
      );
      const categoryTime = categoryActivities.reduce((sum, activity) => 
        sum + activity.duration_minutes, 0
      );

      if (category.weekly_time_goal_minutes && categoryTime >= category.weekly_time_goal_minutes) {
        completedGoals++;
      }
    });

    const goalCompletionRate = categoriesWithGoals.length > 0 
      ? (completedGoals / categoriesWithGoals.length) * 100 
      : 0;

    return {
      totalTimeThisWeek: Math.round(totalTimeThisWeek / 60 * 10) / 10, // Convert to hours
      goalCompletionRate: Math.round(goalCompletionRate),
      activeStreaks: 3, // Placeholder - would need streak calculation logic
      categoriesTracked: flatCategories.length
    };
  }, [activities, categories]);

  const summaryCards = [
    {
      title: "Total Time This Week",
      value: `${analytics.totalTimeThisWeek}h`,
      subtitle: "Across all categories",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Goal Completion",
      value: `${analytics.goalCompletionRate}%`,
      subtitle: "Weekly goals met",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Active Streaks",
      value: analytics.activeStreaks.toString(),
      subtitle: "Consecutive days",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Categories Tracked",
      value: analytics.categoriesTracked.toString(),
      subtitle: "Total categories",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
