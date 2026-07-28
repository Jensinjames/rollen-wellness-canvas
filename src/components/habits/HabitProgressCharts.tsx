import { useMemo } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Habit } from "@/hooks/useHabits";
import { HabitLog } from "@/hooks/useHabitLogs";
import { ChartTooltipCard, TooltipRow } from "@/components/charts/ChartTooltipCard";

interface HabitProgressChartsProps {
  habits: Habit[];
  logs: HabitLog[];
}


export function HabitProgressCharts({ habits, logs }: HabitProgressChartsProps) {
  const completionData = useMemo(() => {
    const data: {
      date: string;
      label: string;
      rate: number;
      completed: number;
      total: number;
      details: { name: string; value: number; target: number; unit: string; done: boolean }[];
    }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), i), "MMM d");
      const dayLogs = logs.filter(l => l.log_date === date);

      let completed = 0;
      const details: { name: string; value: number; target: number; unit: string; done: boolean }[] = [];
      for (const habit of habits) {
        const target = habit.target_value ?? 1;
        const habitValue = dayLogs
          .filter(l => l.habit_id === habit.id)
          .reduce((sum, l) => sum + l.value, 0);
        const done = habitValue >= target;
        if (done) completed++;
        details.push({
          name: habit.name,
          value: habitValue,
          target,
          unit: habit.target_unit ?? "",
          done,
        });
      }

      data.push({
        date,
        label,
        rate: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
        completed,
        total: habits.length,
        details,
      });
    }
    return data;
  }, [habits, logs]);

  const perHabitData = useMemo(() => {
    const data: Record<string, any>[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const label = format(subDays(new Date(), i), "MMM d");
      const row: Record<string, any> = { date, label, raw: {} };

      for (const habit of habits) {
        const target = habit.target_value ?? 1;
        const value = logs
          .filter(l => l.habit_id === habit.id && l.log_date === date)
          .reduce((sum, l) => sum + l.value, 0);
        row[habit.name] = target > 0 ? Math.round((value / target) * 100) : 0;
        row.raw[habit.name] = { value, target, unit: habit.target_unit ?? "" };
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
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                content={({ active, payload }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const row = payload[0].payload;
                  return (
                    <ChartTooltipCard
                      title={row.label}
                      subtitle={`${row.completed} of ${row.total} habits completed`}
                    >
                      <TooltipRow label="Completion rate" value={`${row.rate}%`} emphasis />
                      {row.details?.length > 0 && (
                        <div className="mt-1.5 border-t border-border pt-1.5">
                          {row.details.map((d: any) => (
                            <TooltipRow
                              key={d.name}
                              label={`${d.done ? "✓" : "○"} ${d.name}`}
                              value={`${d.value}/${d.target}${d.unit ? ` ${d.unit}` : ""}`}
                            />
                          ))}
                        </div>
                      )}
                    </ChartTooltipCard>
                  );
                }}
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
