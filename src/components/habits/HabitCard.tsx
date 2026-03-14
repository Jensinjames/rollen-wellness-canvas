import { useState } from "react";
import { Check, Flame, Plus, Minus } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreateHabitLog } from "@/hooks/useHabitLogs";
import { Habit } from "@/hooks/useHabits";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  todayValue: number;
  currentStreak: number;
}

export function HabitCard({ habit, todayValue, currentStreak }: HabitCardProps) {
  const createLog = useCreateHabitLog();
  const [logging, setLogging] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const target = habit.target_value ?? 1;
  const isComplete = todayValue >= target;
  const isMeasurable = target > 1;
  const progress = Math.min((todayValue / target) * 100, 100);

  const quickLog = async (value: number) => {
    setLogging(true);
    try {
      await createLog.mutateAsync({
        habit_id: habit.id,
        log_date: today,
        value,
      });
    } finally {
      setLogging(false);
    }
  };

  return (
    <Card
      className={cn(
        "p-4 transition-colors border-2",
        isComplete
          ? "border-primary/30 bg-primary/5"
          : "border-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{habit.name}</p>
          {isMeasurable ? (
            <p className="text-sm text-muted-foreground">
              {todayValue} / {target} {habit.target_unit ?? ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isComplete ? "Done" : "Not done"}
            </p>
          )}
        </div>

        {isComplete && (
          <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>

      {/* Progress bar for measurable habits */}
      {isMeasurable && (
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {/* Streak */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span>{currentStreak}d</span>
          </div>
        )}
        {currentStreak === 0 && <span />}

        {/* Quick log buttons */}
        {isMeasurable ? (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={logging || todayValue <= 0}
              onClick={() => quickLog(-1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              disabled={logging}
              onClick={() => quickLog(1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant={isComplete ? "secondary" : "default"}
            className="h-7 text-xs"
            disabled={logging || isComplete}
            onClick={() => quickLog(1)}
          >
            {isComplete ? "Done ✓" : "Complete"}
          </Button>
        )}
      </div>
    </Card>
  );
}
