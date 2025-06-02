
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { CalendarView } from "@/components/calendar/CalendarView";
import { ViewSwitcher } from "@/components/calendar/ViewSwitcher";
import { CalendarFilters } from "@/components/calendar/CalendarFilters";
import { ActivityModal } from "@/components/calendar/ActivityModal";
import { useCalendarView } from "@/hooks/useCalendarView";
import { useActivityFilters } from "@/hooks/useActivityFilters";

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-6 space-y-6">
              {/* Header with Sidebar Trigger */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Calendar
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Track your wellness activities across time
                    </p>
                  </div>
                </div>
                <ViewSwitcher view={view} onViewChange={setView} />
              </div>

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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
