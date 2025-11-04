
import { format } from "date-fns";
import { Activity } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { useMemo } from "react";

interface DayCellProps {
  date: Date;
  activities: Activity[];
  onActivityClick: (activityId: string, date: Date) => void;
  className?: string;
}

export function DayCell({ date, activities, onActivityClick, className }: DayCellProps) {
  const { data: categories } = useCategories();
  
  const categoryMap = useMemo(() => {
    if (!categories) return new Map();
    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    return new Map(flatCategories.map(cat => [cat.id, cat]));
  }, [categories]);

  const displayActivities = activities.slice(0, 3);
  const remainingCount = Math.max(0, activities.length - 3);

  // Calculate total duration for goal progress
  const totalMinutes = activities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

  return (
    <div className={`relative w-full h-full min-h-[100px] p-1 ${className}`}>
      {/* Day number */}
      <div className="font-medium text-sm mb-1">
        {format(date, 'd')}
      </div>

      {/* Activity indicators */}
      <div className="space-y-1">
        {displayActivities.map((activity) => {
          const category = categoryMap.get(activity.category_id);
          return (
            <button
              key={activity.id}
              onClick={(e) => {
                e.stopPropagation();
                onActivityClick(activity.id, date);
              }}
              className="w-full text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 py-0.5 transition-colors"
            >
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category?.color || '#3B82F6' }}
                />
                <span className="text-xs truncate text-gray-700 dark:text-gray-300">
                  {activity.categories?.name || 'Activity'}
                </span>
              </div>
            </button>
          );
        })}
        
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500 px-1">
            +{remainingCount} more
          </div>
        )}
      </div>

      {/* Daily summary */}
      {totalHours > 0 && (
        <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white dark:bg-gray-900 rounded px-1">
          {totalHours}h
        </div>
      )}
    </div>
  );
}
