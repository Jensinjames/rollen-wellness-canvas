import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings } from 'lucide-react';
import { EnhancedCategoryCard } from './EnhancedCategoryCard';
import { GlobalOverviewChart } from './GlobalOverviewChart';
import { DateRangeSelector, type DateRangeType } from './DateRangeSelector';
import { RefactoredActivityEntryForm } from '@/components/forms/RefactoredActivityEntryForm';
import { BusinessRulesInsights } from './BusinessRulesInsights';
import { AnalyticsSummary } from '@/components/analytics/AnalyticsSummary';
import { ActivityHistoryTable } from '@/components/ActivityHistoryTable';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useCacheInvalidation } from '@/hooks/useCachedQuery';
import { QueryKeys } from '@/hooks/queryKeys';
import { DashboardSkeleton, CategoryProgressCardSkeleton } from './DashboardSkeleton';
import { ChartErrorBoundary } from '@/components/error/ChartErrorBoundary';
import { LazyWeeklyTrendChart } from '@/components/charts/LazyCharts';
import { useNavigate } from 'react-router-dom';

const EnhancedDashboard: React.FC = memo(() => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeType>('7D');
  const { invalidateCache } = useCacheInvalidation();
  const navigate = useNavigate();
  
  const {
    parentCategories,
    categoryActivityData,
    isLoading,
    error
  } = useDashboardData();

  const handleActivitySuccess = () => {
    setIsFormOpen(false);
    invalidateCache(QueryKeys.Activities);
    invalidateCache(QueryKeys.CategoryActivityData);
    invalidateCache(QueryKeys.AnalyticsSummary);
  };

  const handleCategoryManagement = () => {
    navigate('/categories');
  };

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Error loading dashboard</h2>
          <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCategoryManagement}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
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
        </div>
      </div>

      {/* Date Range Selector */}
      <DateRangeSelector 
        selectedRange={selectedDateRange}
        onRangeChange={setSelectedDateRange}
      />

      {/* Analytics Summary */}
      {isLoading ? (
        <DashboardSkeleton />
      ) : (
        <AnalyticsSummary />
      )}

      {/* Global Overview and Category Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Global Overview Chart - takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <GlobalOverviewChart 
            categories={parentCategories}
            categoryActivityData={categoryActivityData}
          />
        </div>

        {/* Enhanced Category Cards - takes 3 columns on large screens */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <CategoryProgressCardSkeleton key={index} />
              ))
            ) : (
              parentCategories.map(category => {
                const categoryData = categoryActivityData[category.id];
                const actualTime = categoryData?.weeklyTime || 0;
                return (
                  <EnhancedCategoryCard
                    key={category.id}
                    category={category}
                    actualTime={actualTime}
                    subcategoryTimes={categoryData?.subcategoryTimes}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Business Rules Insights - New Phase 2 Feature */}
      <BusinessRulesInsights />

      {/* Analytics Charts - Hidden on mobile */}
      <div className="hidden md:block">
        <ChartErrorBoundary>
          <LazyWeeklyTrendChart />
        </ChartErrorBoundary>
      </div>

      {/* Activity History Table - Responsive */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Activities</h2>
        <ActivityHistoryTable />
      </div>
    </div>
  );
});

EnhancedDashboard.displayName = 'EnhancedDashboard';

export { EnhancedDashboard };