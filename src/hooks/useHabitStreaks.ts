import { useMemo } from 'react';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';
import { useHabitLogs, HabitLog } from './useHabitLogs';
import { Habit } from './useHabits';

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  completedDays: Set<string>;
  last90Days: Map<string, number>; // date -> value
}

function isComplete(log: HabitLog, habit: Habit | undefined): boolean {
  if (!habit) return log.value >= 1;
  if (habit.target_value && habit.target_value > 0) {
    return log.value >= habit.target_value;
  }
  return log.value >= 1;
}

export function useHabitStreaks(habits: Habit[] | undefined) {
  const { data: logs } = useHabitLogs();

  return useMemo(() => {
    if (!habits || !logs) return new Map<string, HabitStreak>();

    const streaks = new Map<string, HabitStreak>();
    const today = format(new Date(), 'yyyy-MM-dd');

    for (const habit of habits) {
      const habitLogs = logs.filter(l => l.habit_id === habit.id);
      const completedDays = new Set<string>();
      const last90Days = new Map<string, number>();

      // Build last 90 days map
      for (let i = 0; i < 90; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        last90Days.set(date, 0);
      }

      // Fill in logged values
      for (const log of habitLogs) {
        if (last90Days.has(log.log_date)) {
          last90Days.set(log.log_date, (last90Days.get(log.log_date) || 0) + log.value);
        }
        if (isComplete(log, habit)) {
          completedDays.add(log.log_date);
        }
      }

      // Calculate current streak (consecutive days ending today or yesterday)
      let currentStreak = 0;
      for (let i = 0; i < 365; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (completedDays.has(date)) {
          currentStreak++;
        } else if (i === 0) {
          // Today not done yet, that's ok - check from yesterday
          continue;
        } else {
          break;
        }
      }

      // Calculate longest streak
      const sortedDates = Array.from(completedDays).sort();
      let longestStreak = 0;
      let streak = 0;
      let prevDate: string | null = null;

      for (const date of sortedDates) {
        if (prevDate && differenceInDays(parseISO(date), parseISO(prevDate)) === 1) {
          streak++;
        } else {
          streak = 1;
        }
        longestStreak = Math.max(longestStreak, streak);
        prevDate = date;
      }

      streaks.set(habit.id, {
        habitId: habit.id,
        currentStreak,
        longestStreak,
        completedDays,
        last90Days,
      });
    }

    return streaks;
  }, [habits, logs]);
}
