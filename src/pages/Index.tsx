
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { WeeklyTrendChart } from "@/components/analytics/WeeklyTrendChart";
import { GoalCompletionChart } from "@/components/analytics/GoalCompletionChart";
import { TimeDistributionChart } from "@/components/analytics/TimeDistributionChart";
import { WellnessDistributionChart } from "@/components/WellnessDistributionChart";
import { ActivityHistoryTable } from "@/components/ActivityHistoryTable";
import { Plus } from "lucide-react";
import { RefactoredActivityEntryForm } from "@/components/forms/RefactoredActivityEntryForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryProgressCard } from "@/components/dashboard/CategoryProgressCard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCacheInvalidation } from "@/hooks/useCachedQuery";
import { CacheManager } from "@/components/cache/CacheManager";
import { AppLayout } from "@/components/layout";
import { DashboardSkeleton, AnalyticsSummarySkeleton, CategoryProgressCardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export default function IndexPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { invalidateCache } = useCacheInvalidation();
  
  // Use the optimized dashboard data hook
  const {
    parentCategories,
    categoryActivityData,
    isLoading,
    error
  } = useDashboardData();

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

  if (error) {
    return (
      <AppLayout pageTitle="Dashboard" headerActions={headerActions}>
        <div className="container py-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error loading dashboard</h2>
            <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Dashboard" headerActions={headerActions}>
      <div className="container space-y-8 py-8">
        {isLoading ? (
          <AnalyticsSummarySkeleton />
        ) : (
          <AnalyticsSummary />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <CategoryProgressCardSkeleton key={index} />
            ))
          ) : (
            parentCategories.map(category => {
              const categoryData = categoryActivityData[category.id];
              const actualTime = categoryData?.weeklyTime || 0;
              return (
                <CategoryProgressCard
                  key={category.id}
                  category={category}
                  actualTime={actualTime}
                  subcategoryTimes={categoryData?.subcategoryTimes}
                />
              );
            })
          )}
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
