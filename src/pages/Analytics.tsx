import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Target } from "lucide-react";
import { AnalyticsSummary } from "@/components/analytics/AnalyticsSummary";
import { CategoryAnalytics } from "@/components/analytics/CategoryAnalytics";
import { GoalCompletionChart } from "@/components/analytics/GoalCompletionChart";
import { TimeDistributionChart } from "@/components/analytics/TimeDistributionChart";
import { WeeklyTrendChart } from "@/components/analytics/WeeklyTrendChart";

const Analytics = () => {
  const headerActions = (
    <div className="flex items-center gap-3">
      <span className="text-sm">
        {new Date().toLocaleDateString()}
      </span>
      <Button variant="outline" size="sm">
        <Calendar className="mr-2 h-4 w-4" />
        Export Data
      </Button>
    </div>
  );

  return (
    <AppLayout pageTitle="Analytics Dashboard" headerActions={headerActions}>
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
    </AppLayout>
  );
};

export default Analytics;
