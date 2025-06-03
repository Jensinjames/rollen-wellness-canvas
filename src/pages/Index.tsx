import { useState, useMemo } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { OverviewCard } from "@/components/OverviewCard";
import { ActivityTracking } from "@/components/ActivityTracking";
import { CategoryProgressCard } from "@/components/dashboard/CategoryProgressCard";
import { LiveProgressIndicator } from "@/components/dashboard/LiveProgressIndicator";
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

  // Set up real-time activities subscription (only once at top level)
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
    },
    {
      title: "Sleep Duration",
      value: averageSleepDuration > 0 ? `${averageSleepDuration}h` : "0h",
      subtitle: "7-day average",
      icon: Moon,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Motivation Level",
      value: latestScore ? `${latestScore.motivation_level_percentage}%` : "50%",
      subtitle: "Current motivation",
      icon: Zap,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Health Balance",
      value: latestScore ? `${latestScore.health_balance_percentage}%` : "0%",
      subtitle: "Overall wellness",
      icon: Heart,
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Weekly Activity",
      value: `${Math.round(weeklyActivityTime / 60)}h`,
      subtitle: "This week's activities",
      icon: Activity,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <TimerProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar />
          <SidebarInset>
            <div className="p-6">
              {/* Header with Sidebar Trigger */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <SidebarTrigger />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Wellness Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your daily wellness activities and progress</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setAddEntryOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Log Time
                </Button>
              </div>

              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                {overviewData.map((item, index) => (
                  <OverviewCard
                    key={index}
                    title={item.title}
                    value={item.value}
                    subtitle={item.subtitle}
                    icon={item.icon}
                    iconColor={item.iconColor}
                    bgColor={item.bgColor}
                  />
                ))}
              </div>

              {/* Live Progress Indicators */}
              {categories && categories.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Progress Today</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categories.map((category) => {
                      const activityData = timezoneActivityData[category.id];
                      if (!activityData) return null;

                      return (
                        <LiveProgressIndicator
                          key={category.id}
                          categoryName={category.name}
                          dailyGoal={category.daily_time_goal_minutes}
                          actualTime={activityData.dailyTime}
                          color={category.color}
                          timeRemaining={timeRemainingToday}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Progress Cards */}
              {categories && categories.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Progress</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.map((category) => {
                      const activityData = categoryActivityData[category.id];
                      const actualTime = activityData ? activityData.dailyTime : 0;
                      const subcategoryTimes = activityData ? activityData.subcategoryTimes : {};

                      return (
                        <CategoryProgressCard
                          key={category.id}
                          category={category}
                          actualTime={actualTime}
                          subcategoryTimes={subcategoryTimes}
                          className="h-full"
                        />
                      );
                    })}
                  </div>
                </div>
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
