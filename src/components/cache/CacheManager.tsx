
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCacheInvalidation } from '@/hooks/useCachedQuery';
import { Trash2, RefreshCw, Activity, Database, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const cacheTypes = [
  { key: 'activities', label: 'Activities', icon: Activity, duration: '5 min' },
  { key: 'categories', label: 'Categories', icon: Database, duration: '30 min' },
  { key: 'category-activity-data', label: 'Category Data', icon: TrendingUp, duration: '10 min' },
  { key: 'analytics-summary', label: 'Analytics', icon: TrendingUp, duration: '15 min' },
  { key: 'daily-scores', label: 'Daily Scores', icon: Activity, duration: '1 hour' },
  { key: 'habits', label: 'Habits', icon: Database, duration: '30 min' },
  { key: 'habit-logs', label: 'Habit Logs', icon: Activity, duration: '10 min' },
];

export const CacheManager = () => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { invalidateCache, invalidateAllUserCache } = useCacheInvalidation();

  const handleInvalidateCache = async (cacheType: string) => {
    setLoading(prev => ({ ...prev, [cacheType]: true }));
    try {
      await invalidateCache(cacheType);
      toast.success(`${cacheType} cache cleared`);
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setLoading(prev => ({ ...prev, [cacheType]: false }));
    }
  };

  const handleInvalidateAllCache = async () => {
    setLoading(prev => ({ ...prev, all: true }));
    try {
      await invalidateAllUserCache();
      toast.success('All caches cleared');
    } catch (error) {
      toast.error('Failed to clear all caches');
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Manage cached data to improve performance
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleInvalidateAllCache}
            disabled={loading.all}
          >
            {loading.all ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All
          </Button>
        </div>

        <div className="grid gap-3">
          {cacheTypes.map((cache) => {
            const Icon = cache.icon;
            return (
              <div 
                key={cache.key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{cache.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Cache duration: {cache.duration}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Cached</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInvalidateCache(cache.key)}
                    disabled={loading[cache.key]}
                  >
                    {loading[cache.key] ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
