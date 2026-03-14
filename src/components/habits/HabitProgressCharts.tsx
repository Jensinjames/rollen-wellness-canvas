import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Habit } from "@/hooks/useHabits";
import { HabitLog } from "@/hooks/useHabitLogs";

interface HabitProgressChartsProps {
  habits: Habit[];
  logs: HabitLog[];
}

export function HabitProgressCharts({ habits, logs }: HabitProgressChartsProps) {
  const completionData = useMemo(() => {
    const data: { date: string; label: string; rate: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), i), "MMM d");
      const dayLogs = logs.filter(l => l.log_date === date);

      let completed = 0;
      for (const habit of habits) {
        const target = habit.target_value ?? 1;
        const habitValue = dayLogs
          .filter(l => l.habit_id === habit.id)
          .reduce((sum, l) => sum + l.value, 0);
        if (habitValue >= target) completed++;
      }

      data.push({
        date,
        label,
        rate: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
      });
    }
    return data;
  }, [habits, logs]);

  const perHabitData = useMemo(() => {
    const data: Record<string, any>[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), i), "MMM d");
      const row: Record<string, any> = { date, label };

      for (const habit of habits) {
        const target = habit.target_value ?? 1;
        const value = logs
          .filter(l => l.habit_id === habit.id && l.log_date === date)
          .reduce((sum, l) => sum + l.value, 0);
        row[habit.name] = target > 0 ? Math.round((value / target) * 100) : 0;
      }

      data.push(row);
    }
    return data;
  }, [habits, logs]);

  const colors = [
    "hsl(var(--primary))",
    "hsl(var(--destructive))",
    "hsl(142, 76%, 36%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
    "hsl(190, 90%, 40%)",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Daily Completion Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={completionData}>
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Completion"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Per-Habit Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={perHabitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              {habits.map((habit, i) => (
                <Line
                  key={habit.id}
                  type="monotone"
                  dataKey={habit.name}
                  stroke={colors[i % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
