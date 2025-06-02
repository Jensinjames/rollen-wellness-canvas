
import { Button } from "@/components/ui/button";
import { Calendar, Grid3x3, Clock } from "lucide-react";
import { CalendarViewType } from "@/hooks/useCalendarView";

interface ViewSwitcherProps {
  view: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  const views = [
    { type: "month" as const, label: "Month", icon: Calendar },
    { type: "week" as const, label: "Week", icon: Grid3x3 },
    { type: "day" as const, label: "Day", icon: Clock },
  ];

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {views.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant={view === type ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange(type)}
          className="flex items-center gap-2"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
