import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Category } from '@/hooks/categories';

interface GlobalOverviewChartProps {
  categories: Category[];
  categoryActivityData: { [categoryId: string]: { weeklyTime: number } };
}

const GlobalOverviewChart: React.FC<GlobalOverviewChartProps> = memo(({
  categories,
  categoryActivityData
}) => {
  const chartData = categories
    .map(category => ({
      name: category.name,
      value: categoryActivityData[category.id]?.weeklyTime || 0,
      color: category.color || '#6B7280'
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalTime = chartData.reduce((sum, item) => sum + item.value, 0);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = totalTime > 0 ? Math.round((data.value / totalTime) * 100) : 0;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium" style={{ color: data.payload.color }}>
            {data.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatTime(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No activity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Weekly Overview</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total: {formatTime(totalTime)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {chartData.slice(0, 6).map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground truncate flex-1">{item.name}</span>
              <span className="font-medium">{formatTime(item.value)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

GlobalOverviewChart.displayName = 'GlobalOverviewChart';

export { GlobalOverviewChart };