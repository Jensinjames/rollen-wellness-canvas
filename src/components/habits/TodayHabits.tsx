import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitCard } from "./HabitCard";
import { Habit } from "@/hooks/useHabits";
import { HabitLog } from "@/hooks/useHabitLogs";
import { HabitStreak } from "@/hooks/useHabitStreaks";

interface TodayHabitsProps {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Map<string, HabitStreak>;
  onEditHabit?: (habit: Habit) => void;
}

export function TodayHabits({ habits, logs, streaks, onEditHabit }: TodayHabitsProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayLogs = logs.filter(l => l.log_date === today);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Today's Habits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {habits.map(habit => {
            const habitTodayLogs = todayLogs.filter(l => l.habit_id === habit.id);
            const todayValue = habitTodayLogs.reduce((sum, l) => sum + l.value, 0);
            const streak = streaks.get(habit.id);
            return (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayValue={todayValue}
                currentStreak={streak?.currentStreak ?? 0}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
