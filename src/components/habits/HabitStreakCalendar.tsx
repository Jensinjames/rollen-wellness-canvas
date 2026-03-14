import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Trophy } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitStreak } from "@/hooks/useHabitStreaks";
import { cn } from "@/lib/utils";

interface HabitStreakCalendarProps {
  habits: Habit[];
  streaks: Map<string, HabitStreak>;
}

export function HabitStreakCalendar({ habits, streaks }: HabitStreakCalendarProps) {
  const days = useMemo(() => {
    const result: string[] = [];
    for (let i = 89; i >= 0; i--) {
      result.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }
    return result;
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Streak Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {habits.map(habit => {
          const streak = streaks.get(habit.id);
          if (!streak) return null;

          const target = habit.target_value ?? 1;

          return (
            <div key={habit.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{habit.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    {streak.currentStreak}d
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-amber-500" />
                    {streak.longestStreak}d
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-[3px]">
                {days.map(date => {
                  const value = streak.last90Days.get(date) ?? 0;
                  const ratio = target > 0 ? Math.min(value / target, 1) : 0;

                  return (
                    <div
                      key={date}
                      className={cn(
                        "h-3 w-3 rounded-[2px] transition-colors",
                        ratio === 0 && "bg-muted",
                        ratio > 0 && ratio < 0.5 && "bg-primary/25",
                        ratio >= 0.5 && ratio < 1 && "bg-primary/50",
                        ratio >= 1 && "bg-primary"
                      )}
                      title={`${date}: ${value}${habit.target_unit ? ` ${habit.target_unit}` : ""}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
