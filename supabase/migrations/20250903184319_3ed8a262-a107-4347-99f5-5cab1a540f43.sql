-- Add performance index for category mappings lookups
CREATE INDEX idx_category_mappings_user_text ON public.category_mappings(user_id, text_input);

-- Create view for unaccounted time calculation per user per day
CREATE VIEW public.daily_unaccounted_time AS
SELECT 
  a.user_id,
  DATE(a.date_time) as activity_date,
  COALESCE(1440 - SUM(a.duration_minutes), 1440) as unaccounted_minutes,
  SUM(a.duration_minutes) as tracked_minutes,
  COUNT(a.id) as activity_count
FROM public.activities a
GROUP BY a.user_id, DATE(a.date_time);