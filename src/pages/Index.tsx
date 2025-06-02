
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { OverviewCard } from "@/components/OverviewCard";
import { CategoryCard } from "@/components/CategoryCard";
import { ActivityTracking } from "@/components/ActivityTracking";
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

  const categoryData = [
    {
      title: "Faith",
      icon: Calendar,
      goal: "10h",
      actual: "0h",
      progress: 0,
      color: "#26c485",
      bgColor: "bg-green-500",
      items: [
        { name: "Daily Prayer", target: "15 mins", actual: "0 mins", progress: 0 },
        { name: "Meditation", target: "10 mins", actual: "0 mins", progress: 0 },
        { name: "Scripture Study", target: "20 mins", actual: "0 mins", progress: 0 }
      ]
    },
    {
      title: "Life",
      icon: Heart,
      goal: "20h", 
      actual: "0h",
      progress: 0,
      color: "#ffcc29",
      bgColor: "bg-yellow-500",
      items: [
        { name: "Family Time", target: "2 hrs/day", actual: "0 hrs", progress: 0 },
        { name: "Social Activities", target: "4 hrs/week", actual: "0 hrs", progress: 0 },
        { name: "Hobbies", target: "3 hrs/week", actual: "0 hrs", progress: 0 }
      ]
    },
    {
      title: "Work",
      icon: BarChart3,
      goal: "40h",
      actual: "0h", 
      progress: 0,
      color: "#fd6f53",
      bgColor: "bg-red-500",
      items: [
        { name: "Productivity", target: "75%", actual: "0%", progress: 0 },
        { name: "Projects Completed", target: "8", actual: "0", progress: 0 },
        { name: "Learning Hours", target: "5 hrs/week", actual: "0 hrs", progress: 0 }
      ]
    },
    {
      title: "Health", 
      icon: Heart,
      goal: "14h",
      actual: "0h",
      progress: 0,
      color: "#f94892",
      bgColor: "bg-pink-500",
      items: [
        { name: "Exercise", target: "3 days/week", actual: "0 days", progress: 0 },
        { name: "Sleep", target: "6.5 hrs/day", actual: "0 hrs", progress: 0 },
        { name: "Stress Level", target: "Moderate", actual: "Unknown", progress: 0 }
      ]
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
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
              <h2 className="text-lg font-semibold mb-4">Daily Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewData.map((card, index) => (
                  <OverviewCard key={index} {...card} />
                ))}
              </div>
            </div>

            {/* Category Performance */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Category Performance</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categoryData.map((category, index) => (
                  <CategoryCard key={index} {...category} />
                ))}
              </div>
            </div>

            {/* Activity Tracking */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Activity Tracking</h2>
              <ActivityTracking />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
