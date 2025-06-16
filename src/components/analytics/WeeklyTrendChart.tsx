
import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useOptimizedActivities } from "@/hooks/useOptimizedActivities";
import { useCategories } from "@/hooks/categories";
import { useMemo } from "react";

const WeeklyTrendChart = memo(() => {
  const { data: activities } = useOptimizedActivities();
  const { data: categories } = useCategories();

  const chartData = useMemo(() => {
    if (!activities || !categories) return [];

    const now = new Date();
    const days = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      days.push(date);
    }

    const parentCategories = categories.filter(cat => cat.level === 0);

    return days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.date_time);
        return activityDate >= dayStart && activityDate <= dayEnd;
      });

      const dayData: any = {
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        total: Math.round(dayActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0) / 60 * 10) / 10
      };

      // Add time for each parent category
      parentCategories.forEach(category => {
        const allCategoryIds = [category.id, ...(category.children?.map(c => c.id) || [])];
        const categoryTime = dayActivities
          .filter(activity => allCategoryIds.includes(activity.category_id))
          .reduce((sum, activity) => sum + activity.duration_minutes, 0);
        
        dayData[category.name.toLowerCase()] = Math.round(categoryTime / 60 * 10) / 10;
      });

      return dayData;
    });
  }, [activities, categories]);

  const parentCategories = categories?.filter(cat => cat.level === 0) || [];

  const chartConfig = parentCategories.reduce((config, category) => {
    config[category.name.toLowerCase()] = {
      label: category.name,
      color: category.color,
    };
    return config;
  }, {} as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity Trends</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 || parentCategories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No activity data available for trend analysis.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                
                {parentCategories.map((category, index) => (
                  <Line
                    key={category.id}
                    type="monotone"
                    dataKey={category.name.toLowerCase()}
                    stroke={category.color}
                    strokeWidth={2}
                    dot={{ fill: category.color, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: category.color, strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
});

WeeklyTrendChart.displayName = 'WeeklyTrendChart';

export { WeeklyTrendChart };
