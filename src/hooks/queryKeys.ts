export const QueryKeys = {
  Activities: 'activities',
  Categories: 'categories',
  CategoryActivityData: 'category-activity-data',
  AnalyticsSummary: 'analytics-summary',
  DailyScores: 'daily-scores',
  Habits: 'habits',
  HabitLogs: 'habit-logs',
} as const;

export type QueryKeyType = typeof QueryKeys[keyof typeof QueryKeys];
