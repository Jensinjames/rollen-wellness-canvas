-- Fix security definer view by recreating with proper RLS
DROP VIEW IF EXISTS public.daily_unaccounted_time;

-- Create secure view for unaccounted time calculation with proper RLS
CREATE VIEW public.daily_unaccounted_time 
WITH (security_invoker = true) AS
SELECT 
  a.user_id,
  DATE(a.date_time) as activity_date,
  COALESCE(1440 - SUM(a.duration_minutes), 1440) as unaccounted_minutes,
  SUM(a.duration_minutes) as tracked_minutes,
  COUNT(a.id) as activity_count
FROM public.activities a
WHERE a.user_id = auth.uid()  -- Enforce RLS in view
GROUP BY a.user_id, DATE(a.date_time);