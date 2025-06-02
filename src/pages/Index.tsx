
import { useState, useMemo } from "react";
import { AppSidebar } from "@/components/Sidebar";
import { OverviewCard } from "@/components/OverviewCard";
import { ActivityTracking } from "@/components/ActivityTracking";
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
import { AddEntryModal } from "@/components/AddEntryModal";
import { useDailyScores, useLatestDailyScore } from "@/hooks/useDailyScores";
import { useSleepEntries } from "@/hooks/useSleepEntries";
import { useActivities } from "@/hooks/useActivities";

const Index = () => {
  const { user, loading } = useAuth();
  const [addEntryOpen, setAddEntryOpen] = useState(false);
  
  // Data hooks for real metrics
  const latestScore = useLatestDailyScore();
  const { data: recentScores } = useDailyScores(7);
  const { data: sleepEntries } = useSleepEntries();
  const { data: activities } = useActivities();

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
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <div className="pl-64">
        <div className="p-8">
          {/* Header with Add Entry Button */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Wellness Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your daily wellness activities and progress</p>
            </div>
            <Button 
              onClick={() => setAddEntryOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Entry
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
      </div>
    </div>
  );
};

export default Index;
