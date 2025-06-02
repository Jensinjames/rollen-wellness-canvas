
import { useState } from "react";

export type CalendarViewType = "month" | "week" | "day";

export const useCalendarView = () => {
  const [view, setView] = useState<CalendarViewType>("month");

  return {
    view,
    setView,
  };
};
