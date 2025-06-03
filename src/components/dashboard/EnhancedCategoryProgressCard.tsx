
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompositeDonutChart } from '@/components/charts/CompositeDonutChart';
import { Category } from '@/hooks/useCategories';
import { getCategoryBrandColor, generateSubcategoryGradient } from '@/utils/categoryColors';
import { Clock, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedCategoryProgressCardProps {
  category: Category;
  actualTime: number;
  subcategoryTimes?: { [subcategoryId: string]: number };
  className?: string;
  onDrillDown?: (categoryId: string) => void;
}

export const EnhancedCategoryProgressCard: React.FC<EnhancedCategoryProgressCardProps> = ({
  category,
  actualTime,
  subcategoryTimes = {},
  className = '',
  onDrillDown
}) => {
  const brandColor = getCategoryBrandColor(category.name);
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

  const isClickable = !!onDrillDown;

  return (
    <Card 
      className={`${className} transition-all duration-200 hover:shadow-lg border-l-4 ${isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''}`} 
      style={{ borderLeftColor: brandColor }}
      onClick={() => onDrillDown?.(category.id)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brandColor }} />
            <span className="truncate">{category.name}</span>
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">{formatTime(actualTime)}</span>
            <span className="sm:hidden">{Math.round(actualTime / 60)}h</span>
          </div>
        </div>
        
        {/* Target vs Actual Display */}
        {(dailyGoal || weeklyGoal) && (
          <div className="bg-gray-50 rounded-lg p-3 mt-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  Target: {formatTime(dailyGoal || weeklyGoal!)}
                </span>
              </div>
              <span className="font-medium" style={{ color: brandColor }}>
                {getProgressPercentage()}% complete
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <TrendingUp className="w-4 h-4" style={{ color: brandColor }} />
              <span className="text-gray-600">
                Logged: {formatTime(actualTime)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex justify-center mb-4">
          <CompositeDonutChart
            category={category}
            actualTime={actualTime}
            dailyGoal={dailyGoal}
            weeklyGoal={weeklyGoal}
            subcategoryTimes={subcategoryTimes}
          />
        </div>
        
        {/* Subcategory breakdown */}
        {category.children && category.children.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Subcategories</h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {category.children.map((subcategory, index) => {
                const time = subcategoryTimes[subcategory.id] || 0;
                const percentage = actualTime > 0 ? Math.round((time / actualTime) * 100) : 0;
                const color = generateSubcategoryGradient(brandColor, index, category.children!.length);
                
                return (
                  <div key={subcategory.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-gray-600 truncate">{subcategory.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
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

        {/* Drill down button for mobile */}
        {isClickable && (
          <div className="mt-4 sm:hidden">
            <Button variant="outline" size="sm" className="w-full text-xs">
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
