
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { CategoryAnalytics } from "@/components/analytics/CategoryAnalytics";
import { WeeklyTrendChart } from "@/components/analytics/WeeklyTrendChart";
import { GoalCompletionChart } from "@/components/analytics/GoalCompletionChart";
import { TimeDistributionChart } from "@/components/analytics/TimeDistributionChart";
import { WellnessDistributionChart } from "@/components/WellnessDistributionChart";
import { ActivityHistoryTable } from "@/components/ActivityHistoryTable";
import { Calendar } from "@/components/Calendar";
import { Plus, Activity, BarChart3, Clock, Target } from "lucide-react";
import { RefactoredActivityEntryForm } from "@/components/forms/RefactoredActivityEntryForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryProgressCard } from "@/components/dashboard/CategoryProgressCard";
import { useCategoryActivityData } from "@/hooks/useCategoryActivityData";
import { useActivityTimezoneData } from "@/hooks/useActivityTimezoneData";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { useCacheInvalidation } from "@/hooks/useCachedQuery";
import { CacheManager } from "@/components/cache/CacheManager";
import { AppLayout } from "@/components/layout";

export default function IndexPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { invalidateCache } = useCacheInvalidation();
  const { data: categories } = useCategories();
  const { data: activities } = useActivities();
  const categoryActivityData = useCategoryActivityData();
  const { timezoneActivityData, timeRemainingToday, refreshTimestamp } = useActivityTimezoneData();

  const now = new Date();
  const startOfToday = startOfDay(now);
  const endOfToday = endOfDay(now);
  const startOfThisWeek = startOfWeek(now);
  const endOfThisWeek = endOfWeek(now);

  const todayActivities = activities?.filter(activity => {
    const activityDate = new Date(activity.date_time);
    return activityDate >= startOfToday && activityDate <= endOfToday;
  }) || [];

  const weekActivities = activities?.filter(activity => {
    const activityDate = new Date(activity.date_time);
    return activityDate >= startOfThisWeek && activityDate <= endOfThisWeek;
  }) || [];

  const todayTotalTime = todayActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
  const weekTotalTime = weekActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);

  const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];

  // Add cache invalidation effect for when new activities are created
  const handleActivitySuccess = () => {
    setIsFormOpen(false);
    // Invalidate relevant caches when new activity is created
    invalidateCache('activities');
    invalidateCache('category-activity-data');
    invalidateCache('analytics-summary');
  };

  const headerActions = (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log New Activity</DialogTitle>
          </DialogHeader>
          <RefactoredActivityEntryForm onSuccess={handleActivitySuccess} />
        </DialogContent>
      </Dialog>
      
      {process.env.NODE_ENV === 'development' && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Cache
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cache Management</DialogTitle>
            </DialogHeader>
            <CacheManager />
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return (
    <AppLayout pageTitle="Dashboard" headerActions={headerActions}>
      <div className="container space-y-8 py-8">
        <AnalyticsSummary />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parentCategories.map(category => {
            const categoryData = timezoneActivityData ? timezoneActivityData[category.id] : null;
            const actualTime = categoryData?.dailyTime || categoryData?.weeklyTime || 0;
            return (
              <CategoryProgressCard
                key={category.id}
                category={category}
                actualTime={actualTime}
                subcategoryTimes={categoryData?.subcategoryTimes}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GoalCompletionChart />
          <TimeDistributionChart />
        </div>

        <WeeklyTrendChart />
        <ActivityHistoryTable />
      </div>
    </AppLayout>
  );
}
