
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Target, TrendingUp, Calendar } from "lucide-react";

interface AnalyticsData {
  totalTimeThisWeek: number;
  goalCompletionRate: number;
  activeStreaks: number;
  categoriesTracked: number;
}

interface OptimizedAnalyticsSummaryProps {
  analyticsData: AnalyticsData;
  isLoading?: boolean;
}

const OptimizedAnalyticsSummary = memo<OptimizedAnalyticsSummaryProps>(({ 
  analyticsData, 
  isLoading = false 
}) => {
  const summaryCards = [
    {
      title: "Total Time This Week",
      value: `${analyticsData.totalTimeThisWeek}h`,
      subtitle: "Across all categories",
      icon: Clock,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Goal Completion",
      value: `${analyticsData.goalCompletionRate}%`,
      subtitle: "Weekly goals met",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Active Streaks",
      value: analyticsData.activeStreaks.toString(),
      subtitle: "Consecutive days",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Categories Tracked",
      value: analyticsData.categoriesTracked.toString(),
      subtitle: "Total categories",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
});

OptimizedAnalyticsSummary.displayName = 'OptimizedAnalyticsSummary';

export { OptimizedAnalyticsSummary };
