
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { DayCell } from "./DayCell";
import { useActivitiesByDate } from "@/hooks/useActivitiesByDate";
import { ActivityFilters } from "@/hooks/useActivityFilters";
import { format } from "date-fns";

interface MonthViewProps {
  filters: ActivityFilters;
  onDateClick: (date: Date) => void;
  onActivityClick: (activityId: string, date: Date) => void;
}

export function MonthView({ filters, onDateClick, onActivityClick }: MonthViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { activitiesByDate, isLoading } = useActivitiesByDate(filters);

  const handleDayClick = (date: Date | undefined) => {
    if (date) {
      onDateClick(date);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedMonth}
        onSelect={handleDayClick}
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        className="rounded-md border-0"
        components={{
          Day: ({ date, ...props }) => {
            const dateKey = format(date, 'yyyy-MM-dd');
            const dayActivities = activitiesByDate[dateKey] || [];
            
            return (
              <DayCell
                date={date}
                activities={dayActivities}
                onActivityClick={onActivityClick}
                {...props}
              />
            );
          },
        }}
      />
    </div>
  );
}
