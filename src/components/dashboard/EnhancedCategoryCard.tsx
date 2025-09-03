import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LazyCompositeDonutChart } from '@/components/charts/LazyCharts';
import { Category } from '@/hooks/categories';
import { generateSubcategoryGradient } from '@/utils/categoryColors';
import { Clock, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedCategoryCardProps {
  category: Category;
  actualTime: number;
  subcategoryTimes?: { [subcategoryId: string]: number };
  className?: string;
}

const EnhancedCategoryCard: React.FC<EnhancedCategoryCardProps> = memo(({
  category,
  actualTime,
  subcategoryTimes = {},
  className = ''
}) => {
  // Data validation and logging
  if (!category || !category.id || !category.name) {
    console.error('EnhancedCategoryCard: Invalid category data', category);
    return null;
  }

  const safeActualTime = Math.max(0, Number(actualTime) || 0);
  const categoryColor = category.color || '#6B7280';
  const dailyGoal = category.daily_time_goal_minutes;
  const weeklyGoal = category.weekly_time_goal_minutes;
  const goalTime = dailyGoal || weeklyGoal || 0;
  
  console.log('EnhancedCategoryCard render:', {
    categoryId: category.id,
    categoryName: category.name,
    actualTime: safeActualTime,
    goalTime,
    subcategoryCount: Object.keys(subcategoryTimes).length
  });
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const progressPercentage = goalTime > 0 ? Math.round((safeActualTime / goalTime) * 100) : 0;
  const deficiency = Math.max(0, goalTime - safeActualTime);
  const isOnTrack = safeActualTime >= goalTime;
  const goalType = dailyGoal ? 'Daily' : weeklyGoal ? 'Weekly' : 'No Goal';

  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-lg", className)}>
      {/* Ribbon Header */}
      <div 
        className="h-12 flex items-center justify-between px-4 text-white font-medium relative"
        style={{ backgroundColor: categoryColor }}
      >
        <h3 className="text-lg font-semibold truncate">{category.name}</h3>
        <div className="flex items-center gap-1 text-sm">
          {isOnTrack ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{progressPercentage}%</span>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Enhanced Donut Chart with proper data mapping */}
        <div className="flex justify-center">
          <LazyCompositeDonutChart
            key={`chart-${category.id}-${safeActualTime}`} // Force re-render when data changes
            categoryName={category.name}
            actualTime={safeActualTime}
            dailyGoal={dailyGoal}
            weeklyGoal={weeklyGoal}
            subcategoryTimes={(() => {
              // Convert subcategory IDs to names for the chart
              const subcategoryTimesByName: { [name: string]: number } = {};
              if (category.children) {
                category.children.forEach(subcategory => {
                  const time = subcategoryTimes[subcategory.id] || 0;
                  if (time > 0 && subcategory.name) {
                    subcategoryTimesByName[subcategory.name] = time;
                  }
                });
              }
              return subcategoryTimesByName;
            })()}
          />
        </div>

        {/* Goal | Actual | Deficiency Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>Goal</span>
            </div>
            <div className="font-medium text-sm" style={{ color: categoryColor }}>
              {formatTime(goalTime)}
            </div>
            <div className="text-xs text-muted-foreground">{goalType}</div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Actual</span>
            </div>
            <div className="font-medium text-sm">
              {formatTime(safeActualTime)}
            </div>
            <div className={cn(
              "text-xs font-medium",
              isOnTrack ? "text-green-600" : "text-orange-600"
            )}>
              {isOnTrack ? "On Track" : "Behind"}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Deficiency</div>
            <div className={cn(
              "font-medium text-sm",
              deficiency > 0 ? "text-red-600" : "text-green-600"
            )}>
              {deficiency > 0 ? `-${formatTime(deficiency)}` : "None"}
            </div>
            <div className="text-xs text-muted-foreground">
              {deficiency > 0 ? "Remaining" : "Complete"}
            </div>
          </div>
        </div>

        {/* Subcategory Progress Bars */}
        {category.children && category.children.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Breakdown
            </h4>
            <div className="space-y-2">
              {category.children.map((subcategory, index) => {
                const time = subcategoryTimes[subcategory.id] || 0;
                const percentage = safeActualTime > 0 ? Math.round((time / safeActualTime) * 100) : 0;
                const color = generateSubcategoryGradient(categoryColor, index, category.children!.length);
                
                return (
                  <div key={subcategory.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-muted-foreground truncate">{subcategory.name}</span>
                      </div>
                      <span className="font-medium">{formatTime(time)}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: color
                        }}
                      />
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

EnhancedCategoryCard.displayName = 'EnhancedCategoryCard';

export { EnhancedCategoryCard };