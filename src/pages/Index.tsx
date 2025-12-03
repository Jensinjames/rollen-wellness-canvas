import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { WeeklyTrendChart } from "@/components/analytics/WeeklyTrendChart";
import { GoalCompletionChart } from "@/components/analytics/GoalCompletionChart";
import { TimeDistributionChart } from "@/components/analytics/TimeDistributionChart";
import { ActivityHistoryTable } from "@/components/ActivityHistoryTable";
import { Plus } from "lucide-react";
import { RefactoredActivityEntryForm } from "@/components/forms/RefactoredActivityEntryForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryProgressCard } from "@/components/dashboard/CategoryProgressCard";
import { useActivityTimezoneData } from "@/hooks/useActivityTimezoneData";
import { useCategories } from "@/hooks/categories";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";

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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalCompletionChart />
              <TimeDistributionChart />
            </div>

            <WeeklyTrendChart />
            <ActivityHistoryTable />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

