
import { cn } from "@/lib/utils";

interface CategoryProgressProps {
  value: number;
  className?: string;
  color: string;
  animated?: boolean;
}

export function CategoryProgress({ value, className, color, animated = true }: CategoryProgressProps) {
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700", className)}>
      <div
        className={cn(
          "h-full transition-all duration-1000 ease-out",
          animated && "animate-[progress_1s_ease-out]"
        )}
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: color,
          transform: animated ? `translateX(-${100 - (value || 0)}%)` : 'none',
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${value}%`}
      />
    </div>
  );
}
