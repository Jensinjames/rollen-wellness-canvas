
import { useState, useMemo } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { EnhancedOverviewCard } from "@/components/dashboard/EnhancedOverviewCard";
import { ActivityTracking } from "@/components/ActivityTracking";
import { EnhancedCategoryProgressCard } from "@/components/dashboard/EnhancedCategoryProgressCard";
import { EnhancedLiveProgressIndicator } from "@/components/dashboard/EnhancedLiveProgressIndicator";
import { ResponsiveCategoryGrid } from "@/components/dashboard/ResponsiveCategoryGrid";
import { TimerDisplay } from "@/components/timer/TimerDisplay";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Moon,
  Zap,
  Heart,
  Activity,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { TimerProvider } from "@/contexts/TimerContext";
import { AddEntryModal } from "@/components/AddEntryModal";
import { useDailyScores, useLatestDailyScore } from "@/hooks/useDailyScores";
import { useSleepEntries } from "@/hooks/useSleepEntries";
import { useActivities } from "@/hooks/useActivities";
import { useRealtimeActivities } from "@/hooks/useRealtimeActivities";
import { useCategories } from "@/hooks/useCategories";
import { useCategoryActivityData } from "@/hooks/useCategoryActivityData";
import { useActivityTimezoneData } from "@/hooks/useActivityTimezoneData";

const Index = () => {
  const { user, loading } = useAuth();
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  
  // Data hooks for real metrics
  const latestScore = useLatestDailyScore();
  const { data: recentScores } = useDailyScores(7);
  const { data: sleepEntries } = useSleepEntries();
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();
  const categoryActivityData = useCategoryActivityData();
  const { timezoneActivityData, timeRemainingToday } = useActivityTimezoneData();

  // Set up real-time activities subscription
  useRealtimeActivities();

  // Calculate real metrics
  const averageSleepDuration = useMemo(() => {
    if (!sleepEntries || sleepEntries.length === 0) return 0;
    const recentSleep = sleepEntries.slice(0, 7); // Last 7 days
    const totalMinutes = recentSleep.reduce((sum, entry) => sum + entry.sleep_duration_minutes, 0);
    return Math.round((totalMinutes / recentSleep.length) / 60 * 10) / 10; // Hours with 1 decimal
  }, [sleepEntries]);

  const weeklyActivityTime = useMemo(() => {
    if (!activities || activities.length === 0) return 0;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentActivities = activities.filter(activity => 
      new Date(activity.date_time) >= oneWeekAgo
    );
    
    return recentActivities.reduce((sum, activity) => sum + activity.duration_minutes, 0);
  }, [activities]);

  const overviewData = [
    {
      title: "Daily Score",
      value: latestScore ? `${latestScore.daily_score_percentage}%` : "0%",
      subtitle: "Today's wellness score",
      icon: TrendingUp,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      tooltip: "Calculated based on your daily activities, sleep quality, and health metrics. Updated in real-time as you log activities."
    },
    {
      title: "Sleep Duration",
      value: averageSleepDuration > 0 ? `${averageSleepDuration}h` : "0h",
      subtitle: "7-day average",
      icon: Moon,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      tooltip: "Your average sleep duration over the past 7 days. Optimal sleep ranges from 7-9 hours per night."
    },
    {
      title: "Motivation Level",
      value: latestScore ? `${latestScore.motivation_level_percentage}%` : "50%",
      subtitle: "Current motivation",
      icon: Zap,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      tooltip: "Reflects your energy and motivation levels based on recent activities and self-assessments."
    },
    {
      title: "Health Balance",
      value: latestScore ? `${latestScore.health_balance_percentage}%` : "0%",
      subtitle: "Overall wellness",
      icon: Heart,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      tooltip: "Comprehensive health score considering physical activity, mental wellness, and lifestyle balance."
    },
    {
      title: "Weekly Activity",
      value: `${Math.round(weeklyActivityTime / 60)}h`,
      subtitle: "This week's activities",
      icon: Activity,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      tooltip: "Total time spent on tracked activities this week across all categories."
    },
  ];

  const handleQuickAdd = () => {
    setAddEntryOpen(true);
  };

  const handleCategoryDrillDown = (categoryId: string) => {
    // TODO: Implement drill-down to category details
    console.log('Drill down to category:', categoryId);
  };

  return (
    <TimerProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar />
          <SidebarInset>
            <div className="p-4 sm:p-6">
              {/* Header with Sidebar Trigger */}
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Wellness Dashboard</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Track your daily wellness activities and progress</p>
                  </div>
                </div>
                <Button 
                  onClick={handleQuickAdd}
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Log Time</span>
                </Button>
              </div>

              {/* Overview Cards - Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-6 sm:mb-8">
                {overviewData.map((item, index) => (
                  <div key={index} className={index === 4 ? "col-span-2 sm:col-span-2 lg:col-span-1" : ""}>
                    <EnhancedOverviewCard
                      title={item.title}
                      value={item.value}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      iconColor={item.iconColor}
                      bgColor={item.bgColor}
                      tooltip={item.tooltip}
                    />
                  </div>
                ))}
              </div>

              {/* Live Progress Indicators */}
              {categories && categories.length > 0 && (
                <ResponsiveCategoryGrid 
                  title="Live Progress Today" 
                  onQuickAdd={handleQuickAdd}
                >
                  {categories.map((category) => {
                    const activityData = timezoneActivityData[category.id];
                    if (!activityData) return null;

                    return (
                      <EnhancedLiveProgressIndicator
                        key={category.id}
                        categoryName={category.name}
                        dailyGoal={category.daily_time_goal_minutes}
                        actualTime={activityData.dailyTime}
                        color={category.color}
                        timeRemaining={timeRemainingToday}
                        onQuickAdd={handleQuickAdd}
                      />
                    );
                  })}
                </ResponsiveCategoryGrid>
              )}

              {/* Category Progress Cards */}
              {categories && categories.length > 0 && (
                <ResponsiveCategoryGrid title="Category Progress">
                  {categories.map((category) => {
                    const activityData = categoryActivityData[category.id];
                    const actualTime = activityData ? activityData.dailyTime : 0;
                    const subcategoryTimes = activityData ? activityData.subcategoryTimes : {};

                    return (
                      <EnhancedCategoryProgressCard
                        key={category.id}
                        category={category}
                        actualTime={actualTime}
                        subcategoryTimes={subcategoryTimes}
                        onDrillDown={handleCategoryDrillDown}
                        className="h-full"
                      />
                    );
                  })}
                </ResponsiveCategoryGrid>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityTracking />
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Calendar View</h3>
                  <p className="text-gray-600">Visit the Calendar page to see your activities in calendar format.</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/calendar'}>
                    Go to Calendar
                  </Button>
                </div>
              </div>

              {/* Add Entry Modal */}
              <AddEntryModal 
                open={addEntryOpen} 
                onOpenChange={setAddEntryOpen} 
              />
            </div>
          </SidebarInset>
        </div>

        {/* Timer Display - Fixed positioned overlay */}
        <TimerDisplay />
      </SidebarProvider>
    </TimerProvider>
  );
};

export default Index;
