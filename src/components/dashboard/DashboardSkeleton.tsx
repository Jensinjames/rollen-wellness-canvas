
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CategoryProgressCardSkeleton() {
  return (
    <Card className="transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative">
          <Skeleton className="w-full h-48 rounded-lg" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container space-y-8 py-8">
      <AnalyticsSummarySkeleton />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <CategoryProgressCardSkeleton key={index} />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
      
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}
