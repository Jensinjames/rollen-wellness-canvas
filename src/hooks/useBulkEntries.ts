import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkEntry {
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  activity: string;
  category_id: string;
  subcategory_id: string;
  notes?: string;
  is_completed?: boolean;
}

interface ValidationRule {
  enforce_15_min_increments?: boolean;
  auto_round_15_min?: boolean;
  sleep_cutoff_hour?: number;
}

interface BulkInsertResult {
  success: boolean;
  inserted: number;
  total: number;
  warnings?: Array<{ entry: number; warning: string }>;
  errors?: Array<{ entry: number; errors: string[] }>;
  entries?: any[];
}

export const useBulkEntries = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      entries, 
      validation_rules = {} 
    }: { 
      entries: BulkEntry[]; 
      validation_rules?: ValidationRule;
    }): Promise<BulkInsertResult> => {
      const { data, error } = await supabase.functions.invoke('entries-bulk', {
        body: { entries, validation_rules }
      });

      if (error) {
        throw new Error(error.message || 'Failed to insert bulk entries');
      }

      return data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['category-activity-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });

      if (data.success) {
        toast.success(`Successfully inserted ${data.inserted} of ${data.total} entries`);
        
        if (data.warnings && data.warnings.length > 0) {
          toast.warning(`${data.warnings.length} warnings were generated during import`);
        }
      } else {
        toast.error(`Failed to insert entries: ${data.errors?.length || 0} validation errors`);
      }
    },
    onError: (error) => {
      console.error('Error inserting bulk entries:', error);
      toast.error('Failed to insert bulk entries');
    },
  });
};