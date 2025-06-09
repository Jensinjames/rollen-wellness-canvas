import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { useMemo } from "react";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {data.value}h ({data.payload.percentage}% of total time)
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium">{entry.value}</span>
          <span className="text-sm text-muted-foreground">
            ({entry.payload.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
};

export function WellnessDistributionChart() {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();

  const wellnessData = useMemo(() => {
    if (!activities || !categories) return [];

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const weekActivities = activities.filter(activity => 
      new Date(activity.date_time) >= weekStart
    );

    const parentCategories = categories.filter(cat => cat.level === 0);
    
    const categoryTimes = parentCategories.map(category => {
      // Get time for parent category and all its children
      const allCategoryIds = [category.id, ...(category.children?.map(c => c.id) || [])];
      
      const categoryActivities = weekActivities.filter(activity => 
        allCategoryIds.includes(activity.category_id)
      );

      const totalMinutes = categoryActivities.reduce((sum, activity) => 
        sum + activity.duration_minutes, 0
      );

      return {
        name: category.name,
        value: Math.round(totalMinutes / 60 * 10) / 10,
        color: category.color,
        minutes: totalMinutes
      };
    }).filter(item => item.value > 0);

    const totalTime = categoryTimes.reduce((sum, item) => sum + item.value, 0);

    return categoryTimes.map(item => ({
      ...item,
      percentage: totalTime > 0 ? Math.round((item.value / totalTime) * 100) : 0
    }));
  }, [activities, categories]);

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Wellness Distribution</h3>
        <p className="text-sm text-muted-foreground">
          How you spend your time across different wellness categories this week
        </p>
      </div>
      
      {wellnessData.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No activity data available for this week.
          </p>
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wellnessData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                animationBegin={0}
                animationDuration={1000}
              >
                {wellnessData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
