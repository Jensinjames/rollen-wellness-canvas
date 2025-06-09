import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/UnifiedAuthContext';

export const useRealtimeActivities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Create a unique channel name for this user session
    const channelName = `activities-realtime-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Activities realtime update received');
          // Invalidate activities query to refresh data
          queryClient.invalidateQueries({ queryKey: ['activities'] });
          queryClient.invalidateQueries({ queryKey: ['category-activity-data'] });
        }
      )
      .subscribe((status) => {
        console.log('Activities subscription status:', status);
      });

    return () => {
      console.log('Cleaning up activities subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
};
