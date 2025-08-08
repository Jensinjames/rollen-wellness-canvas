import { useState } from "react";
import { Card } from "@/components/ui/card";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ViewSwitcher } from "@/components/calendar/ViewSwitcher";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { ActivityModal } from "@/components/calendar/ActivityModal";
import { useCalendarView } from "@/hooks/useCalendarView";
import { useActivityFilters } from "@/hooks/useActivityFilters";
import { AppLayout } from "@/components/layout";

export default function Calendar() {
  const { view, setView } = useCalendarView();
  const { filters, updateFilters, clearFilters } = useActivityFilters();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setSelectedActivity(null);
    setIsModalOpen(true);
  };

  const handleActivityClick = (activityId: string, date: Date) => {
    setSelectedActivity(activityId);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setSelectedActivity(null);
  };

  const headerActions = (
    <ViewSwitcher view={view} onViewChange={setView} />
  );

  return (
    <AppLayout pageTitle="Calendar" headerActions={headerActions}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto p-6 space-y-6">
          {/* Filters */}
          <CalendarFilters 
            filters={filters}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />

          {/* Calendar */}
          <Card className="p-6">
            <CalendarView
              view={view}
              filters={filters}
              onDateClick={handleDateClick}
              onActivityClick={handleActivityClick}
            />
          </Card>

          {/* Activity Modal */}
          <ActivityModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            selectedDate={selectedDate}
            activityId={selectedActivity}
          />
        </div>
      </div>
    </AppLayout>
  );
}
