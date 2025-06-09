
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CachedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  queryType: string;
  params?: string;
  fallbackFn?: () => Promise<T>;
  enableCache?: boolean;
}

interface CacheResponse<T> {
  data: T;
  cached: boolean;
  cacheKey: string;
  cacheExpiry?: string;
}

export const useCachedQuery = <T>({
  queryKey,
  queryType,
  params,
  fallbackFn,
  enableCache = true,
  ...options
}: CachedQueryOptions<T>) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...queryKey, 'cached', params],
    queryFn: async (): Promise<T> => {
      if (!user || !enableCache) {
        // Fall back to direct query if no user or caching disabled
        if (fallbackFn) {
          return await fallbackFn();
        }
        throw new Error('No fallback function provided for non-cached query');
      }

      try {
        // Try cache layer first
        const { data: response, error } = await supabase.functions.invoke('cache-layer', {
          body: JSON.stringify({ queryType, params }),
        });

        if (error) {
          console.warn('Cache layer error, falling back to direct query:', error);
          if (fallbackFn) {
            return await fallbackFn();
          }
          throw error;
        }

        const cacheResponse = response as CacheResponse<T>;
        
        // Log cache performance
        if (process.env.NODE_ENV === 'development') {
          console.log(`Cache ${cacheResponse.cached ? 'HIT' : 'MISS'} for ${queryType}`, {
            cacheKey: cacheResponse.cacheKey,
            cacheExpiry: cacheResponse.cacheExpiry,
          });
        }

        return cacheResponse.data;
      } catch (cacheError) {
        console.warn('Cache layer failed, falling back to direct query:', cacheError);
        if (fallbackFn) {
          return await fallbackFn();
        }
        throw cacheError;
      }
    },
    enabled: !!user && options.enabled !== false,
    ...options,
  });
};

// Cache invalidation helper
export const useCacheInvalidation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateCache = async (queryType: string, params?: string) => {
    if (!user) return;

    try {
      await supabase.functions.invoke('cache-layer', {
        body: JSON.stringify({ 
          queryType, 
          params: params || 'all',
          invalidate: true 
        }),
      });

      // Also invalidate local React Query cache
      queryClient.invalidateQueries({ 
        queryKey: [queryType],
        exact: false 
      });

      console.log(`Cache invalidated for ${queryType}`);
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
    }
  };

  const invalidateAllUserCache = async () => {
    if (!user) return;

    const queryTypes = [
      'activities',
      'categories', 
      'category-activity-data',
      'analytics-summary',
      'daily-scores',
      'habits',
      'habit-logs'
    ];

    for (const queryType of queryTypes) {
      await invalidateCache(queryType);
    }
  };

  return {
    invalidateCache,
    invalidateAllUserCache,
  };
};
