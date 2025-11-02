
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityUpdateNotification {
  id: string;
  categoryName: string;
  subcategoryName: string;
  duration: number;
  timestamp: string;
  color: string;
}

interface AnimatedDashboardUpdatesProps {
  onNewActivity?: (activity: ActivityUpdateNotification) => void;
}

export const AnimatedDashboardUpdates: React.FC<AnimatedDashboardUpdatesProps> = ({
  onNewActivity
}) => {
  const [recentUpdates, setRecentUpdates] = useState<ActivityUpdateNotification[]>([]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (onNewActivity) {
      // This would be called when a new activity is logged
      const handleNewActivity = (activity: ActivityUpdateNotification) => {
        setRecentUpdates(prev => [activity, ...prev.slice(0, 4)]); // Keep last 5
        setAnimationKey(prev => prev + 1);
        
        // Show toast notification
        toast.success(
          `Time logged: ${Math.floor(activity.duration / 60)}h ${activity.duration % 60}m to ${activity.subcategoryName}`,
          {
            icon: <CheckCircle className="h-4 w-4" style={{ color: activity.color }} />,
            duration: 3000,
          }
        );
      };

      onNewActivity(handleNewActivity as any);
    }
  }, [onNewActivity]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {recentUpdates.map((update, index) => (
          <motion.div
            key={`${update.id}-${animationKey}`}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]"
            style={{ marginBottom: index * 4 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: update.color }}
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">
                    {update.categoryName} → {update.subcategoryName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(update.duration)} logged</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
