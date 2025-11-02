
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Target, Clock } from "lucide-react";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { CategoryAnalytics } from "@/components/analytics/CategoryAnalytics";
import { GoalCompletionChart } from "@/components/analytics/GoalCompletionChart";
import { TimeDistributionChart } from "@/components/analytics/TimeDistributionChart";
import { WeeklyTrendChart } from "@/components/analytics/WeeklyTrendChart";

const Analytics = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-white hover:bg-white/10" />
                <div>
                  <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                  <p className="text-purple-100">Track your progress and insights</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm bg-white/10 px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Calendar className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <AnalyticsSummary />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TimeDistributionChart />
                  <GoalCompletionChart />
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <CategoryAnalytics />
              </TabsContent>

              <TabsContent value="goals" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GoalCompletionChart />
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Goal Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Detailed goal completion metrics and recommendations coming soon.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <WeeklyTrendChart />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Monthly Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Monthly trend analysis and insights coming soon.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;
