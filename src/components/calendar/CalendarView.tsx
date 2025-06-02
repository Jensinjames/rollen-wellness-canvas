
import { CalendarViewType } from "@/hooks/useCalendarView";
import { ActivityFilters } from "@/hooks/useActivityFilters";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";

interface CalendarViewProps {
  view: CalendarViewType;
  filters: ActivityFilters;
  onDateClick: (date: Date) => void;
  onActivityClick: (activityId: string, date: Date) => void;
}

export function CalendarView({ 
  view, 
  filters, 
  onDateClick, 
  onActivityClick 
}: CalendarViewProps) {
  switch (view) {
    case "month":
      return (
        <MonthView 
          filters={filters}
          onDateClick={onDateClick}
          onActivityClick={onActivityClick}
        />
      );
    case "week":
      return (
        <WeekView 
          filters={filters}
          onDateClick={onDateClick}
          onActivityClick={onActivityClick}
        />
      );
    case "day":
      return (
        <DayView 
          filters={filters}
          onDateClick={onDateClick}
          onActivityClick={onActivityClick}
        />
      );
    default:
      return (
        <MonthView 
          filters={filters}
          onDateClick={onDateClick}
          onActivityClick={onActivityClick}
        />
      );
  }
}
