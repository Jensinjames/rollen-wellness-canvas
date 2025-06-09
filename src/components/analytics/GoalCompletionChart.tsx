
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { useMemo } from "react";

export function GoalCompletionChart() {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();

  const chartData = useMemo(() => {
    if (!activities || !categories) return [];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const weekActivities = activities.filter(activity => 
      new Date(activity.date_time) >= weekStart
    );

    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    
    return flatCategories
      .filter(category => category.weekly_time_goal_minutes)
      .map(category => {
        const categoryActivities = weekActivities.filter(activity => 
          activity.category_id === category.id
        );

        const totalTime = categoryActivities.reduce((sum, activity) => 
          sum + activity.duration_minutes, 0
        );

        const goalTime = category.weekly_time_goal_minutes || 0;
        const completionRate = goalTime > 0 ? Math.min((totalTime / goalTime) * 100, 100) : 0;

        return {
          name: category.name.length > 10 ? category.name.substring(0, 10) + '...' : category.name,
          fullName: category.name,
          completion: Math.round(completionRate),
          actual: Math.round(totalTime / 60 * 10) / 10,
          goal: Math.round(goalTime / 60 * 10) / 10,
          color: category.color
        };
      })
      .sort((a, b) => b.completion - a.completion);
  }, [activities, categories]);

  const chartConfig = chartData.reduce((config, item, index) => {
    config[`completion-${index}`] = {
      label: item.fullName,
      color: item.color,
    };
    return config;
  }, {} as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Goal Completion</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No weekly goals set. Add time goals to your categories to see completion rates.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: '% Complete', angle: -90, position: 'insideLeft' }}
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{data.fullName}</p>
                          <p className="text-sm">
                            {data.completion}% complete ({data.actual}h / {data.goal}h)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="completion" 
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
