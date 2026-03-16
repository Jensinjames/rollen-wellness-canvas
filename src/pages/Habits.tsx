import { useState } from "react";
import { Plus } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { useHabits } from "@/hooks/useHabits";
import { useHabitLogs } from "@/hooks/useHabitLogs";
import { useHabitStreaks } from "@/hooks/useHabitStreaks";
import { TodayHabits } from "@/components/habits/TodayHabits";
import { HabitStreakCalendar } from "@/components/habits/HabitStreakCalendar";
import { HabitProgressCharts } from "@/components/habits/HabitProgressCharts";
import { HabitFormDialog } from "@/components/habits/HabitFormDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Habits() {
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: logs, isLoading: logsLoading } = useHabitLogs();
  const streaks = useHabitStreaks(habits ?? undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<import("@/hooks/useHabits").Habit | undefined>();

  const activeHabits = habits?.filter(h => h.is_active) ?? [];
  const isLoading = habitsLoading || logsLoading;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b px-4 gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Habits</h1>
            <div className="ml-auto">
              <Button size="sm" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> New Habit
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-8 overflow-auto">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-72 w-full" />
              </div>
            ) : activeHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground mb-4">No habits yet. Create your first habit to start tracking!</p>
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Create Habit
                </Button>
              </div>
            ) : (
              <>
                <TodayHabits habits={activeHabits} logs={logs ?? []} streaks={streaks} />
                <HabitStreakCalendar habits={activeHabits} streaks={streaks} />
                <HabitProgressCharts habits={activeHabits} logs={logs ?? []} />
              </>
            )}
          </main>

          <HabitFormDialog open={formOpen} onOpenChange={setFormOpen} />
        </div>
      </div>
    </SidebarProvider>
  );
}
