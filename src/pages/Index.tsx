import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { OverviewCard } from "@/components/OverviewCard";
import { EnhancedCategoryCard } from "@/components/EnhancedCategoryCard";
import { ActivityTracking } from "@/components/ActivityTracking";
import { ActivityHistoryTable } from "@/components/ActivityHistoryTable";
import { WellnessDistributionChart } from "@/components/WellnessDistributionChart";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity, Clock, Heart, Calendar, Settings } from "lucide-react";

const Index = () => {
  const overviewData = [
    {
      title: "Daily Score",
      value: "0%",
      subtitle: "Overall daily performance score",
      icon: BarChart3,
      iconColor: "text-white",
      bgColor: "bg-blue-500"
    },
    {
      title: "Motivation Level", 
      value: "0%",
      subtitle: "Average motivation level",
      icon: Activity,
      iconColor: "text-white",
      bgColor: "bg-purple-500"
    },
    {
      title: "Sleep Duration",
      value: "0h",
      subtitle: "Average sleep hours",
      icon: Clock,
      iconColor: "text-white", 
      bgColor: "bg-indigo-500"
    },
    {
      title: "Health Balance",
      value: "0%",
      subtitle: "Overall health score",
      icon: Heart,
      iconColor: "text-white",
      bgColor: "bg-green-500"
    }
  ];

  const enhancedCategoryData = [
    {
      title: "Faith",
      icon: Calendar,
      goal: "10h",
      actual: "2.5h",
      progress: 25,
      color: "#26c485",
      bgColor: "bg-green-500",
      items: [
        { name: "Daily Prayer", target: "15 mins", actual: "15 mins", progress: 100 },
        { name: "Meditation", target: "10 mins", actual: "5 mins", progress: 50 },
        { name: "Scripture Study", target: "20 mins", actual: "0 mins", progress: 0 }
      ]
    },
    {
      title: "Life",
      icon: Heart,
      goal: "20h", 
      actual: "6h",
      progress: 30,
      color: "#ffcc29",
      bgColor: "bg-yellow-500",
      items: [
        { name: "Family Time", target: "2 hrs/day", actual: "1.5 hrs", progress: 75 },
        { name: "Social Activities", target: "4 hrs/week", actual: "2 hrs", progress: 50 },
        { name: "Hobbies", target: "3 hrs/week", actual: "0.5 hrs", progress: 17 }
      ]
    },
    {
      title: "Work",
      icon: BarChart3,
      goal: "40h",
      actual: "14h", 
      progress: 35,
      color: "#fd6f53",
      bgColor: "bg-red-500",
      items: [
        { name: "Productivity", target: "75%", actual: "65%", progress: 87 },
        { name: "Projects Completed", target: "8", actual: "3", progress: 38 },
        { name: "Learning Hours", target: "5 hrs/week", actual: "2 hrs", progress: 40 }
      ]
    },
    {
      title: "Health", 
      icon: Heart,
      goal: "14h",
      actual: "1.4h",
      progress: 10,
      color: "#f94892",
      bgColor: "bg-pink-500",
      items: [
        { name: "Exercise", target: "3 days/week", actual: "1 day", progress: 33 },
        { name: "Sleep", target: "6.5 hrs/day", actual: "6 hrs", progress: 92 },
        { name: "Stress Level", target: "Low", actual: "Moderate", progress: 60 }
      ]
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <div>
                  <h1 className="text-2xl font-bold">Wellness Dashboard</h1>
                  <p className="text-blue-100">Track your wellness journey</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-white/10 px-3 py-1 rounded-full">
                  Apr 13, 2025 - Apr 20, 2025
                </span>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Manage Categories
                </Button>
                <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
                  + Add Entry
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Overview Cards */}
            <div>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Daily Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewData.map((card, index) => (
                  <OverviewCard key={index} {...card} />
                ))}
              </div>
            </div>

            {/* Category Performance */}
            <div>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Category Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {enhancedCategoryData.map((category, index) => (
                  <EnhancedCategoryCard key={index} {...category} />
                ))}
              </div>
            </div>

            {/* Wellness Distribution */}
            <div>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Wellness Distribution</h2>
              <WellnessDistributionChart />
            </div>

            {/* Activity History */}
            <div>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Activity History</h2>
              <ActivityHistoryTable />
            </div>

            {/* Activity Tracking */}
            <div>
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Activity Tracking</h2>
              <ActivityTracking />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
