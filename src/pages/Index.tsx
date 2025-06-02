
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { OverviewCard } from "@/components/OverviewCard";
import { EnhancedCategoryCard } from "@/components/EnhancedCategoryCard";
import { ActivityTracking } from "@/components/ActivityTracking";
import { ActivityHistoryTable } from "@/components/ActivityHistoryTable";
import { WellnessDistributionChart } from "@/components/WellnessDistributionChart";
import { Button } from "@/components/ui/button";
import { BarChart3, Activity, Clock, Heart, Plus } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useActivities } from "@/hooks/useActivities";

const Index = () => {
  const { data: categories } = useCategories();
  const { data: activities } = useActivities();

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

  // Transform categories for enhanced cards using real data
  const enhancedCategoryData = categories?.map(category => ({
    title: category.name,
    icon: Heart, // You can map specific icons based on category name
    goal: "10h",
    actual: "2.5h",
    progress: 25,
    color: category.color,
    bgColor: `bg-${category.color}`, // This might need adjustment
    items: [
      { name: "Sample Activity", target: "15 mins", actual: "15 mins", progress: 100 },
    ]
  })) || [];

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
                  {new Date().toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Manage Categories
                </Button>
                <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
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
