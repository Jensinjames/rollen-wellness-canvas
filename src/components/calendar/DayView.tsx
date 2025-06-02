
import { ActivityFilters } from "@/hooks/useActivityFilters";

interface DayViewProps {
  filters: ActivityFilters;
  onDateClick: (date: Date) => void;
  onActivityClick: (activityId: string, date: Date) => void;
}

export function DayView({ filters, onDateClick, onActivityClick }: DayViewProps) {
  return (
    <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 rounded-lg">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Day View Coming Soon
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Daily calendar view will be available in the next update
        </p>
      </div>
    </div>
  );
}
