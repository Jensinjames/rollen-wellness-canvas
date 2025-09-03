import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ParsedEntry {
  date?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes: number;
  activity: string;
  category?: string;
  subcategory?: string;
  raw_text: string;
  mapping?: {
    category_id: string;
    subcategory_id: string;
    confidence_score: number;
  };
}

interface TextLogParseResult {
  success: boolean;
  entries: ParsedEntry[];
  total: number;
  error?: string;
}

export const useTextLogParser = () => {
  return useMutation({
    mutationFn: async ({ text_log, date }: { text_log: string; date?: string }): Promise<TextLogParseResult> => {
      const { data, error } = await supabase.functions.invoke('ingest-text-log', {
        body: { text_log, date }
      });

      if (error) {
        throw new Error(error.message || 'Failed to parse text log');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully parsed ${data.total} entries from text log`);
    },
    onError: (error) => {
      console.error('Error parsing text log:', error);
      toast.error('Failed to parse text log');
    },
  });
};