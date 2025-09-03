
import React, { useMemo, useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Category } from '@/hooks/categories';
import { generateSubcategoryGradient } from '@/utils/categoryColors';
import { ChartErrorBoundary } from '@/components/error/ChartErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

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

const CompositeDonutChartInternal: React.FC<CompositeDonutChartProps> = ({
  category,
  actualTime,
  dailyGoal,
  weeklyGoal,
  subcategoryTimes = {},
  className = ''
}) => {
  const [isClient, setIsClient] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Ensure we're on client side for SVG rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Validate input data
  const validatedData = useMemo(() => {
    try {
      // Validate category
      if (!category || !category.id || typeof category.name !== 'string') {
        throw new Error('Invalid category data');
      }

      // Validate numeric values
      const safeActualTime = Math.max(0, Number(actualTime) || 0);
      const safeDailyGoal = dailyGoal ? Math.max(0, Number(dailyGoal)) : undefined;
      const safeWeeklyGoal = weeklyGoal ? Math.max(0, Number(weeklyGoal)) : undefined;

      // Validate color format
      let safeColor = category.color || '#6B7280';
      if (!/^#[0-9A-F]{6}$/i.test(safeColor)) {
        console.warn(`Invalid category color: ${safeColor}, using fallback`);
        safeColor = '#6B7280';
      }

      // Validate subcategory times
      const safeSubcategoryTimes: { [key: string]: number } = {};
      if (subcategoryTimes && typeof subcategoryTimes === 'object') {
        Object.entries(subcategoryTimes).forEach(([id, time]) => {
          const numericTime = Number(time);
          if (!isNaN(numericTime) && numericTime >= 0) {
            safeSubcategoryTimes[id] = numericTime;
          }
        });
      }

      console.log('CompositeDonutChart validated data:', {
        categoryId: category.id,
        categoryName: category.name,
        actualTime: safeActualTime,
        dailyGoal: safeDailyGoal,
        weeklyGoal: safeWeeklyGoal,
        color: safeColor,
        subcategoryCount: Object.keys(safeSubcategoryTimes).length
      });

      return {
        category: { ...category, color: safeColor },
        actualTime: safeActualTime,
        dailyGoal: safeDailyGoal,
        weeklyGoal: safeWeeklyGoal,
        subcategoryTimes: safeSubcategoryTimes
      };
    } catch (error) {
      console.error('CompositeDonutChart validation error:', error);
      setRenderError(error instanceof Error ? error.message : 'Data validation failed');
      return null;
    }
  }, [category, actualTime, dailyGoal, weeklyGoal, subcategoryTimes]);

  if (!isClient) {
    return <Skeleton className="h-[200px] w-full rounded-full" />;
  }

  if (renderError || !validatedData) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm">Chart unavailable</p>
          {renderError && <p className="text-xs mt-1">{renderError}</p>}
        </div>
      </div>
    );
  }
  const categoryColor = validatedData.category.color;
  
  const chartData = useMemo(() => {
    const goal = validatedData.dailyGoal || validatedData.weeklyGoal || 60; // Default 1 hour if no goal set
    const remaining = Math.max(0, goal - validatedData.actualTime);
    
    // Outer ring data (parent category vs goal)
    const outerData: ChartDataItem[] = [
      {
        name: `${validatedData.category.name} (Actual)`,
        value: Math.min(validatedData.actualTime, goal),
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
    if (validatedData.category.children && validatedData.category.children.length > 0) {
      validatedData.category.children.forEach((subcategory, index) => {
        const subcategoryTime = validatedData.subcategoryTimes[subcategory.id] || 0;
        if (subcategoryTime > 0) {
          innerData.push({
            name: subcategory.name,
            value: subcategoryTime,
            color: generateSubcategoryGradient(categoryColor, index, validatedData.category.children!.length),
            isSubcategory: true
          });
        }
      });
      
      // Add remaining time if subcategories don't account for all actual time
      const subcategoryTotal = innerData.reduce((sum, item) => sum + item.value, 0);
      const unaccountedTime = validatedData.actualTime - subcategoryTotal;
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
        name: validatedData.category.name,
        value: validatedData.actualTime,
        color: categoryColor,
        isSubcategory: true
      });
    }
    
    return { outerData, innerData };
  }, [validatedData, categoryColor]);

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
          <div className="text-lg font-bold text-foreground">
            {Math.floor(validatedData.actualTime / 60)}h {validatedData.actualTime % 60}m
          </div>
          <div className="text-xs text-muted-foreground">
            {validatedData.dailyGoal ? `Daily Goal: ${Math.floor(validatedData.dailyGoal / 60)}h ${validatedData.dailyGoal % 60}m` : 
             validatedData.weeklyGoal ? `Weekly Goal: ${Math.floor(validatedData.weeklyGoal / 60)}h ${validatedData.weeklyGoal % 60}m` : 
             'No Goal Set'}
          </div>
          {(validatedData.dailyGoal || validatedData.weeklyGoal) && (
            <div className="text-xs font-medium" style={{ color: categoryColor }}>
              {Math.round((validatedData.actualTime / (validatedData.dailyGoal || validatedData.weeklyGoal || 1)) * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with error boundary
export const CompositeDonutChart: React.FC<CompositeDonutChartProps> = (props) => (
  <ChartErrorBoundary>
    <CompositeDonutChartInternal {...props} />
  </ChartErrorBoundary>
);
