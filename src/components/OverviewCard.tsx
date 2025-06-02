
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OverviewCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  isLoading?: boolean;
}

export function OverviewCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  bgColor,
  isLoading = false 
}: OverviewCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mb-4`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
