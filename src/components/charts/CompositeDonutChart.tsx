
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Category } from '@/hooks/categories';
import { generateSubcategoryGradient } from '@/utils/categoryColors';

interface CompositeDonutChartProps {
  category: Category;
  actualTime: number; // in minutes
  dailyGoal?: number; // in minutes
  weeklyGoal?: number; // in minutes
  subcategoryTimes?: { [subcategoryId: string]: number };
  className?: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  isGoal?: boolean;
  isSubcategory?: boolean;
}

export const CompositeDonutChart: React.FC<CompositeDonutChartProps> = ({
  category,
  actualTime,
  dailyGoal,
  weeklyGoal,
  subcategoryTimes = {},
  className = ''
}) => {
  // Use the actual category color from the database instead of hard-coded brand color
  const categoryColor = category.color || '#6B7280'; // fallback to gray if no color
  
  const chartData = useMemo(() => {
    const goal = dailyGoal || weeklyGoal || 60; // Default 1 hour if no goal set
    const remaining = Math.max(0, goal - actualTime);
    
    // Outer ring data (parent category vs goal)
    const outerData: ChartDataItem[] = [
      {
        name: `${category.name} (Actual)`,
        value: Math.min(actualTime, goal),
        color: categoryColor,
        isGoal: false
      }
    ];
    
    if (remaining > 0) {
      outerData.push({
        name: 'Remaining Goal',
        value: remaining,
        color: `${categoryColor}20`, // 20% opacity
        isGoal: true
      });
    }
    
    // Inner ring data (subcategory breakdown)
    const innerData: ChartDataItem[] = [];
    if (category.children && category.children.length > 0) {
      category.children.forEach((subcategory, index) => {
        const subcategoryTime = subcategoryTimes[subcategory.id] || 0;
        if (subcategoryTime > 0) {
          innerData.push({
            name: subcategory.name,
            value: subcategoryTime,
            color: generateSubcategoryGradient(categoryColor, index, category.children!.length),
            isSubcategory: true
          });
        }
      });
      
      // Add remaining time if subcategories don't account for all actual time
      const subcategoryTotal = innerData.reduce((sum, item) => sum + item.value, 0);
      const unaccountedTime = actualTime - subcategoryTotal;
      if (unaccountedTime > 0) {
        innerData.push({
          name: 'Other',
          value: unaccountedTime,
          color: `${categoryColor}80`, // 50% opacity
          isSubcategory: true
        });
      }
    } else {
      // No subcategories, show full actual time in inner ring
      innerData.push({
        name: category.name,
        value: actualTime,
        color: categoryColor,
        isSubcategory: true
      });
    }
    
    return { outerData, innerData };
  }, [category, actualTime, dailyGoal, weeklyGoal, subcategoryTimes, categoryColor]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const hours = Math.floor(data.value / 60);
      const minutes = data.value % 60;
      const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">{timeStr}</p>
          {data.isGoal && <p className="text-xs text-gray-500">Remaining to reach goal</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          {/* Outer ring - Goal vs Actual */}
          <Pie
            data={chartData.outerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            startAngle={90}
            endAngle={450}
          >
            {chartData.outerData.map((entry, index) => (
              <Cell key={`outer-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
            ))}
          </Pie>
          
          {/* Inner ring - Subcategory breakdown */}
          <Pie
            data={chartData.innerData}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={25}
            outerRadius={60}
            startAngle={90}
            endAngle={450}
          >
            {chartData.innerData.map((entry, index) => (
              <Cell key={`inner-${index}`} fill={entry.color} stroke="white" strokeWidth={1} />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text with progress info */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {Math.floor(actualTime / 60)}h {actualTime % 60}m
          </div>
          <div className="text-xs text-gray-500">
            {dailyGoal ? `Daily Goal: ${Math.floor(dailyGoal / 60)}h ${dailyGoal % 60}m` : 
             weeklyGoal ? `Weekly Goal: ${Math.floor(weeklyGoal / 60)}h ${weeklyGoal % 60}m` : 
             'No Goal Set'}
          </div>
          {(dailyGoal || weeklyGoal) && (
            <div className="text-xs font-medium" style={{ color: categoryColor }}>
              {Math.round((actualTime / (dailyGoal || weeklyGoal || 1)) * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
