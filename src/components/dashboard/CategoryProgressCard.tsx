
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompositeDonutChart } from '@/components/charts/CompositeDonutChart';
import { Category } from '@/hooks/categories';
import { generateSubcategoryGradient } from '@/utils/categoryColors';
import { Clock, Target } from 'lucide-react';

interface CategoryProgressCardProps {
  category: Category;
  actualTime: number;
  subcategoryTimes?: { [subcategoryId: string]: number };
  className?: string;
}

const CategoryProgressCard: React.FC<CategoryProgressCardProps> = memo(({
  category,
  actualTime,
  subcategoryTimes = {},
  className = ''
}) => {
  // Use the actual category color from the database instead of hard-coded brand color
  const categoryColor = category.color || '#6B7280'; // fallback to gray if no color
  
  const dailyGoal = category.daily_time_goal_minutes;
  const weeklyGoal = category.weekly_time_goal_minutes;
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressPercentage = () => {
    const goal = dailyGoal || weeklyGoal;
    if (!goal) return 0;
    return Math.round((actualTime / goal) * 100);
  };

  return (
    <Card className={`${className} transition-all duration-200 hover:shadow-lg border-l-4`} 
          style={{ borderLeftColor: categoryColor }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor }} />
            {category.name}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {formatTime(actualTime)}
          </div>
        </div>
        
        {(dailyGoal || weeklyGoal) && (
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              Goal: {formatTime(dailyGoal || weeklyGoal!)} 
              <span className="ml-1" style={{ color: categoryColor }}>
                ({getProgressPercentage()}%)
              </span>
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <CompositeDonutChart
          category={category}
          actualTime={actualTime}
          dailyGoal={dailyGoal}
          weeklyGoal={weeklyGoal}
          subcategoryTimes={subcategoryTimes}
        />
        
        {/* Subcategory breakdown */}
        {category.children && category.children.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Subcategories</h4>
            <div className="grid grid-cols-1 gap-1">
              {category.children.map((subcategory, index) => {
                const time = subcategoryTimes[subcategory.id] || 0;
                const percentage = actualTime > 0 ? Math.round((time / actualTime) * 100) : 0;
                const color = generateSubcategoryGradient(categoryColor, index, category.children!.length);
                
                return (
                  <div key={subcategory.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-gray-600">{subcategory.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{formatTime(time)}</span>
                      {percentage > 0 && (
                        <span className="text-xs text-gray-400">({percentage}%)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CategoryProgressCard.displayName = 'CategoryProgressCard';

export { CategoryProgressCard };
