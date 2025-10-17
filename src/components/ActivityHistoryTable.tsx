import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { Search, TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCachedActivities } from "@/hooks/useCachedActivities";
import { useCachedCategories } from "@/hooks/useCachedCategories";
import { useTableSort } from "@/hooks/useTableSort";

interface ProcessedActivity {
  id: string;
  activity: string;
  category: string;
  date: string;
  dateValue: number;
  value: string;
  durationMinutes: number;
  trend: string;
  categoryColor: string;
}

export function ActivityHistoryTable() {
  const { data: activities } = useCachedActivities();
  const { data: categories } = useCachedCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const processedActivities = useMemo(() => {
    if (!activities || !categories) return [];

    const flatCategories = categories.flatMap(cat => [cat, ...(cat.children || [])]);
    const categoryMap = new Map(flatCategories.map(cat => [cat.id, cat]));

    return activities.slice(0, 20).map(activity => {
      const category = categoryMap.get(activity.category_id);
      const subcategory = activity.subcategory || activity.category;
      const date = new Date(activity.date_time);

      const trend = activity.duration_minutes > 60 ? 'up' :
                   activity.duration_minutes < 30 ? 'down' : 'flat';

      return {
        id: activity.id,
        activity: subcategory?.name || category?.name || 'Unknown Activity',
        category: category?.name || 'Unknown',
        date: date.toLocaleDateString(),
        dateValue: date.getTime(),
        value: activity.duration_minutes >= 60
          ? `${Math.round(activity.duration_minutes / 60 * 10) / 10}h`
          : `${activity.duration_minutes}m`,
        durationMinutes: activity.duration_minutes,
        trend,
        categoryColor: category?.color || 'hsl(var(--primary))'
      } as ProcessedActivity;
    });
  }, [activities, categories]);

  const filteredData = useMemo(() => {
    return processedActivities.filter(item => {
      const matchesSearch = item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [processedActivities, searchTerm, selectedCategory]);

  const { sortedData, sortState, getSortProps } = useTableSort<ProcessedActivity, keyof ProcessedActivity>(
    filteredData,
    (item, column) => item[column],
    'dateValue',
    'desc'
  );

  const availableCategories = useMemo(() => {
    return Array.from(new Set(processedActivities.map(item => item.category)));
  }, [processedActivities]);

  useEffect(() => {
    if (liveRegionRef.current) {
      const count = sortedData.length;
      const message = count === 0
        ? "No activities found"
        : `Showing ${count} ${count === 1 ? 'activity' : 'activities'}`;
      liveRegionRef.current.textContent = message;
    }
  }, [sortedData.length, sortState]);

  const getTrendIcon = (trend: string, color: string) => {
    const trendLabels = {
      up: 'Trending up',
      down: 'Trending down',
      flat: 'Stable'
    };

    const label = trendLabels[trend as keyof typeof trendLabels] || 'Unknown';

    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" style={{ color }} aria-label={label} />;
      case 'down':
        return <TrendingDown className="h-4 w-4" style={{ color }} aria-label={label} />;
      default:
        return <Minus className="h-4 w-4" style={{ color }} aria-label={label} />;
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, item: ProcessedActivity) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  };

  return (
    <Card className="overflow-hidden">
      <div
        ref={liveRegionRef}
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />

      <div className="p-6 border-b bg-muted/50">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h3 id="activity-history-title" className="text-lg font-semibold">Activity History</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Label htmlFor="activity-search" className="sr-only">
                Search activities by name or category
              </Label>
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                id="activity-search"
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Search activities by name or category"
                aria-controls="activity-table"
              />
            </div>
            <div>
              <Label htmlFor="category-filter" className="sr-only">
                Filter by category
              </Label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Filter activities by category"
                aria-controls="activity-table"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table
          id="activity-table"
          aria-label="Activity history table"
          aria-describedby="activity-history-title"
          aria-rowcount={sortedData.length}
        >
          <TableCaption className="sr-only">
            Your recent activity history showing activity name, category, date, duration, and trend.
            Click on column headers to sort the table.
          </TableCaption>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <SortableTableHead
                className="font-semibold"
                sortDirection={sortState.column === 'activity' ? sortState.direction : 'none'}
                {...getSortProps('activity')}
              >
                Activity
              </SortableTableHead>
              <SortableTableHead
                className="font-semibold"
                sortDirection={sortState.column === 'category' ? sortState.direction : 'none'}
                {...getSortProps('category')}
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                className="font-semibold"
                sortDirection={sortState.column === 'dateValue' ? sortState.direction : 'none'}
                {...getSortProps('dateValue')}
              >
                Date
              </SortableTableHead>
              <SortableTableHead
                className="font-semibold"
                sortDirection={sortState.column === 'durationMinutes' ? sortState.direction : 'none'}
                {...getSortProps('durationMinutes')}
              >
                Duration
              </SortableTableHead>
              <SortableTableHead
                className="font-semibold"
                sortable={false}
              >
                Trend
              </SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow
                key={item.id}
                className={cn(
                  "transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  index % 2 === 0 ? "bg-background" : "bg-muted/20"
                )}
                tabIndex={0}
                onKeyDown={(e) => handleRowKeyDown(e, item)}
                aria-rowindex={index + 2}
              >
                <TableCell className="font-medium" role="cell">
                  {item.activity}
                </TableCell>
                <TableCell role="cell">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium text-primary-foreground"
                    style={{ backgroundColor: item.categoryColor }}
                    role="status"
                    aria-label={`Category: ${item.category}`}
                  >
                    {item.category}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground" role="cell">
                  <time dateTime={new Date(item.dateValue).toISOString()}>
                    {item.date}
                  </time>
                </TableCell>
                <TableCell className="font-medium" role="cell">
                  {item.value}
                </TableCell>
                <TableCell role="cell">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.trend, item.categoryColor)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedData.length === 0 && (
        <div
          className="p-8 text-center space-y-2"
          role="status"
          aria-live="polite"
        >
          <Filter className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" aria-hidden="true" />
          {processedActivities.length === 0 ? (
            <>
              <p className="font-medium text-muted-foreground">No activities yet!</p>
              <p className="text-sm text-muted-foreground">Click "Add Activity" above to start tracking your time.</p>
            </>
          ) : (
            <p className="text-muted-foreground">No activities found matching your criteria.</p>
          )}
        </div>
      )}
    </Card>
  );
}
