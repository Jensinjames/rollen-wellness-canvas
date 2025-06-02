import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, TrendingUp, TrendingDown, Minus, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityHistoryItem {
  id: string;
  activity: string;
  category: string;
  date: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  categoryColor: string;
}

const mockHistoryData: ActivityHistoryItem[] = [
  { id: '1', activity: 'Daily Prayer', category: 'Faith', date: '2025-01-02', value: '15 mins', trend: 'up', categoryColor: '#26c485' },
  { id: '2', activity: 'Exercise', category: 'Health', date: '2025-01-02', value: '45 mins', trend: 'up', categoryColor: '#f94892' },
  { id: '3', activity: 'Work Focus', category: 'Work', date: '2025-01-02', value: '6 hrs', trend: 'down', categoryColor: '#fd6f53' },
  { id: '4', activity: 'Family Time', category: 'Life', date: '2025-01-01', value: '2 hrs', trend: 'flat', categoryColor: '#ffcc29' },
  { id: '5', activity: 'Meditation', category: 'Faith', date: '2025-01-01', value: '10 mins', trend: 'up', categoryColor: '#26c485' },
  { id: '6', activity: 'Sleep', category: 'Health', date: '2025-01-01', value: '7 hrs', trend: 'up', categoryColor: '#f94892' },
];

export function ActivityHistoryTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredData = mockHistoryData.filter(item => {
    const matchesSearch = item.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(mockHistoryData.map(item => item.category)));

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
      <div className="p-6 border-b bg-gray-50 dark:bg-gray-800/50">
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
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 dark:bg-gray-800/30">
              <TableHead className="font-semibold">Activity</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Value</TableHead>
              <TableHead className="font-semibold">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow 
                key={item.id}
                className={cn(
                  "transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                  index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/20"
                )}
              >
                <TableCell className="font-medium">{item.activity}</TableCell>
                <TableCell>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
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
          <p>No activities found matching your criteria.</p>
        </div>
      )}
    </Card>
  );
}
