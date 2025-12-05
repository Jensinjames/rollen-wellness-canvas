import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { Plus } from "lucide-react";
import { RefactoredActivityEntryForm } from "@/components/forms/RefactoredActivityEntryForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryProgressCard } from "@/components/dashboard/CategoryProgressCard";
import { useActivityTimezoneData } from "@/hooks/useActivityTimezoneData";
import { useCategories } from "@/hooks/categories";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { LazyComponent } from "@/hooks/useLazyComponent";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart components
const WeeklyTrendChart = lazy(() => import("@/components/analytics/WeeklyTrendChart").then(m => ({ default: m.WeeklyTrendChart })));
const GoalCompletionChart = lazy(() => import("@/components/analytics/GoalCompletionChart").then(m => ({ default: m.GoalCompletionChart })));
const TimeDistributionChart = lazy(() => import("@/components/analytics/TimeDistributionChart").then(m => ({ default: m.TimeDistributionChart })));
const ActivityHistoryTable = lazy(() => import("@/components/ActivityHistoryTable").then(m => ({ default: m.ActivityHistoryTable })));

const ChartSkeleton = () => (
  <Skeleton className="h-80 w-full rounded-lg" />
);

export default function IndexPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: categories } = useCategories();
  const { timezoneActivityData } = useActivityTimezoneData();

  const parentCategories = categories?.filter(cat => cat.level === 0 && cat.is_active) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container space-y-8 py-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
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
                  <RefactoredActivityEntryForm onSuccess={() => setIsFormOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

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

            <LazyComponent fallback={<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ChartSkeleton /><ChartSkeleton /></div>}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Suspense fallback={<ChartSkeleton />}>
                  <GoalCompletionChart />
                </Suspense>
                <Suspense fallback={<ChartSkeleton />}>
                  <TimeDistributionChart />
                </Suspense>
              </div>
            </LazyComponent>

            <LazyComponent fallback={<ChartSkeleton />}>
              <Suspense fallback={<ChartSkeleton />}>
                <WeeklyTrendChart />
              </Suspense>
            </LazyComponent>

            <LazyComponent fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
              <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" />}>
                <ActivityHistoryTable />
              </Suspense>
            </LazyComponent>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
