
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { useMemo } from "react";

export function TimeDistributionChart() {
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

    const parentCategories = categories.filter(cat => cat.level === 0);
    
    return parentCategories.map(category => {
      // Get time for parent category and all its children
      const allCategoryIds = [category.id, ...(category.children?.map(c => c.id) || [])];
      
      const categoryActivities = weekActivities.filter(activity => 
        allCategoryIds.includes(activity.category_id)
      );

      const totalTime = categoryActivities.reduce((sum, activity) => 
        sum + activity.duration_minutes, 0
      );

      const breakdown = (category.children || [])
        .map(child => ({
          name: child.name,
          minutes: weekActivities
            .filter(a => a.category_id === child.id)
            .reduce((sum, a) => sum + a.duration_minutes, 0),
        }))
        .filter(sub => sub.minutes > 0)
        .sort((a, b) => b.minutes - a.minutes);

      return {
        name: category.name,
        value: Math.round(totalTime / 60 * 10) / 10, // Convert to hours
        color: category.color,
        minutes: totalTime,
        sessions: categoryActivities.length,
        breakdown
      };
    }).filter(item => item.value > 0);

  }, [activities, categories]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const chartConfig = chartData.reduce((config, item) => {
    config[item.name.toLowerCase()] = {
      label: item.name,
      color: item.color,
    };
    return config;
  }, {} as any);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
      return (
        <ChartTooltipCard title={item.name} color={item.color} subtitle="This week">
          <TooltipRow label="Time logged" value={formatMinutes(item.minutes)} />
          <TooltipRow label="Decimal hours" value={`${item.value}h`} />
          <TooltipRow label="Share of total" value={`${percentage}%`} />
          <TooltipRow label="Sessions" value={item.sessions} />
          {item.breakdown?.length > 0 && (
            <div className="mt-2 border-t border-border pt-1.5">
              {item.breakdown.map((sub: any) => (
                <TooltipRow
                  key={sub.name}
                  label={sub.name}
                  value={formatMinutes(sub.minutes)}
                />
              ))}
            </div>
          )}
        </ChartTooltipCard>
      );
    }
    return null;
  };


  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = total > 0 ? Math.round((entry.payload.value / total) * 100) : 0;
          return (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium">{entry.value}</span>
              <span className="text-sm text-muted-foreground">
                ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Distribution (This Week)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No activity data available for this week.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="40%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
