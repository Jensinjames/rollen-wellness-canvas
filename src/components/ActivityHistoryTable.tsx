import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActivities } from "@/hooks/useActivities";
import { useCategories } from "@/hooks/categories";
import { useMemo } from "react";

export function ActivityHistoryTable() {
  const { data: activities } = useActivities();
  const { data: categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const processedActivities = useMemo(() => {
    if (!activities || !categories) return [];

    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    const categoryMap = new Map(flatCategories.map(cat => [cat.id, cat]));

    return activities.slice(0, 20).map(activity => {
      const category = categoryMap.get(activity.category_id);
      const date = new Date(activity.date_time);
      
      // Simple trend calculation based on duration (placeholder logic)
      const trend = activity.duration_minutes > 60 ? 'up' : 
                   activity.duration_minutes < 30 ? 'down' : 'flat';

      return {
        id: activity.id,
        activity: activity.name,
        category: category?.name || 'Unknown',
        date: date.toLocaleDateString(),
        value: activity.duration_minutes >= 60 
          ? `${Math.round(activity.duration_minutes / 60 * 10) / 10}h`
          : `${activity.duration_minutes}m`,
        trend,
        categoryColor: category?.color || 'hsl(var(--primary))'
      };
    });
  }, [activities, categories]);

  const filteredData = processedActivities.filter(item => {
    const matchesSearch = item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const availableCategories = useMemo(() => {
    return Array.from(new Set(processedActivities.map(item => item.category)));
  }, [processedActivities]);

  const getTrendIcon = (trend: string, color: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" style={{ color }} />;
      case 'down':
        return <TrendingDown className="h-4 w-4" style={{ color }} />;
      default:
        return <Minus className="h-4 w-4" style={{ color }} />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6 border-b bg-muted/50">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-semibold">Activity History</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-background"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Activity</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Duration</TableHead>
              <TableHead className="font-semibold">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow 
                key={item.id}
                className={cn(
                  "transition-colors hover:bg-muted/50",
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
              >
                <TableCell className="font-medium">{item.activity}</TableCell>
                <TableCell>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-primary-foreground"
                    style={{ backgroundColor: item.categoryColor }}
                  >
                    {item.category}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.date}</TableCell>
                <TableCell className="font-medium">{item.value}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.trend, item.categoryColor)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredData.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>
            {processedActivities.length === 0 
              ? "No activities found. Start logging activities to see them here."
              : "No activities found matching your criteria."
            }
          </p>
        </div>
      )}
    </Card>
  );
}
