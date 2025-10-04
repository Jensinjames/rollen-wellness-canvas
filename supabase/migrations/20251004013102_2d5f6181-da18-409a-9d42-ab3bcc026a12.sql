-- Phase 1: Critical Security Fix
-- Add DELETE policy for daily_scores table

CREATE POLICY "Users can delete their own daily scores" 
ON public.daily_scores 
FOR DELETE 
USING (auth.uid() = user_id);