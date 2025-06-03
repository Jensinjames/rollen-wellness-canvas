
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EnhancedTooltip } from "@/components/ui/enhanced-tooltip";

interface EnhancedOverviewCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  tooltip?: string;
  isLoading?: boolean;
}

export function EnhancedOverviewCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor, 
  bgColor,
  tooltip,
  isLoading = false 
}: EnhancedOverviewCardProps) {
  return (
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${bgColor} flex items-center justify-center mb-3 sm:mb-4`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</h3>
              {tooltip && <EnhancedTooltip content={tooltip} />}
            </div>
            {isLoading ? (
              <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold animate-fade-in">{value}</p>
            )}
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
