
import { useState } from "react";
import { LucideIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryProgress } from "@/components/CategoryProgress";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  icon: LucideIcon;
  goal: string;
  actual: string;
  progress: number;
  color: string;
  bgColor: string;
  items: Array<{ name: string; target: string; actual: string; progress: number }>;
}

export function EnhancedCategoryCard({ title, icon: Icon, goal, actual, progress, color, bgColor, items }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="p-4 text-white" style={{ backgroundColor: bgColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label={isExpanded ? `Collapse ${title} details` : `Expand ${title} details`}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-2xl font-bold">{goal}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Actual</p>
            <p className="text-2xl font-bold">{actual}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <CategoryProgress value={progress} color={color} />
        </div>

        <div className={cn(
          "transition-all duration-300 ease-out overflow-hidden",
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="space-y-3 mb-6">
            {items.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{item.actual} / {item.target}</span>
                </div>
                <CategoryProgress value={item.progress} color={color} className="h-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray={`${progress}, 100`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{progress}%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button 
            className="text-sm font-medium transition-colors hover:underline"
            style={{ color: color }}
          >
            View Details →
          </button>
        </div>
      </div>
    </Card>
  );
}
