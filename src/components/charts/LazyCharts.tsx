
import React, { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chart components for better performance
const WeeklyTrendChart = React.lazy(() => 
  import('@/components/analytics/WeeklyTrendChart').then(module => ({ 
    default: module.WeeklyTrendChart 
  }))
);

const GoalCompletionChart = React.lazy(() => 
  import('@/components/analytics/GoalCompletionChart').then(module => ({ 
    default: module.GoalCompletionChart 
  }))
);

const TimeDistributionChart = React.lazy(() => 
  import('@/components/analytics/TimeDistributionChart').then(module => ({ 
    default: module.TimeDistributionChart 
  }))
);

const CompositeDonutChart = React.lazy(() => 
  import('@/components/charts/CompositeDonutChart').then(module => ({ 
    default: module.CompositeDonutChart 
  }))
);

// Chart skeleton fallback
const ChartSkeleton = () => (
  <div className="w-full h-80 p-6">
    <Skeleton className="h-6 w-48 mb-4" />
    <Skeleton className="h-64 w-full rounded-lg" />
  </div>
);

// Wrapper components with suspense
export const LazyWeeklyTrendChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <WeeklyTrendChart {...props} />
  </Suspense>
);

export const LazyGoalCompletionChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <GoalCompletionChart {...props} />
  </Suspense>
);

export const LazyTimeDistributionChart = (props: any) => (
  <Suspense fallback={<ChartSkeleton />}>
    <TimeDistributionChart {...props} />
  </Suspense>
);

export const LazyCompositeDonutChart = (props: any) => (
  <Suspense fallback={<div className="w-full h-48"><Skeleton className="h-full w-full rounded-full" /></div>}>
    <CompositeDonutChart {...props} />
  </Suspense>
);
