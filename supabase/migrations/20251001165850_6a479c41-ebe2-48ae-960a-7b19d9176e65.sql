-- Drop and recreate views with SECURITY INVOKER to respect RLS policies

DROP VIEW IF EXISTS public.category_totals CASCADE;
DROP VIEW IF EXISTS public.activity_streaks CASCADE;
DROP VIEW IF EXISTS public.goal_deficiencies CASCADE;

-- Recreate category_totals view with SECURITY INVOKER
CREATE VIEW public.category_totals
WITH (security_invoker=on)
AS
SELECT 
  c.id as category_id,
  c.user_id,
  c.name as category_name,
  c.color,
  COALESCE(SUM(a.duration_minutes), 0) as total_minutes_today,
  COALESCE(SUM(CASE WHEN a.start_time >= date_trunc('week', CURRENT_DATE) THEN a.duration_minutes ELSE 0 END), 0) as total_minutes_week,
  c.daily_time_goal_minutes,
  c.weekly_time_goal_minutes
FROM public.categories c
LEFT JOIN public.activities a ON a.category_id = c.id 
  AND a.user_id = c.user_id
  AND DATE(a.start_time) = CURRENT_DATE
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.user_id, c.name, c.color, c.daily_time_goal_minutes, c.weekly_time_goal_minutes;

-- Recreate activity_streaks view with SECURITY INVOKER
CREATE VIEW public.activity_streaks
WITH (security_invoker=on)
AS
SELECT 
  c.id as category_id,
  c.user_id,
  c.name as category_name,
  c.color,
  MIN(DATE(a.start_time)) as streak_start,
  MAX(DATE(a.start_time)) as streak_end,
  COUNT(DISTINCT DATE(a.start_time)) as streak_length,
  SUM(a.duration_minutes) as total_streak_minutes
FROM public.categories c
JOIN public.activities a ON a.category_id = c.id AND a.user_id = c.user_id
WHERE c.user_id = auth.uid()
GROUP BY c.id, c.user_id, c.name, c.color;

-- Recreate goal_deficiencies view with SECURITY INVOKER
CREATE VIEW public.goal_deficiencies
WITH (security_invoker=on)
AS
SELECT 
  c.id as category_id,
  c.user_id,
  c.name as category_name,
  c.color,
  CURRENT_DATE as deficiency_date,
  CASE 
    WHEN COALESCE(SUM(CASE WHEN DATE(a.start_time) = CURRENT_DATE THEN a.duration_minutes ELSE 0 END), 0) < c.daily_time_goal_minutes 
    THEN true ELSE false 
  END as is_daily_behind,
  GREATEST(0, c.daily_time_goal_minutes - COALESCE(SUM(CASE WHEN DATE(a.start_time) = CURRENT_DATE THEN a.duration_minutes ELSE 0 END), 0)) as daily_deficiency,
  CASE 
    WHEN COALESCE(SUM(CASE WHEN a.start_time >= date_trunc('week', CURRENT_DATE) THEN a.duration_minutes ELSE 0 END), 0) < c.weekly_time_goal_minutes 
    THEN true ELSE false 
  END as is_weekly_behind,
  GREATEST(0, c.weekly_time_goal_minutes - COALESCE(SUM(CASE WHEN a.start_time >= date_trunc('week', CURRENT_DATE) THEN a.duration_minutes ELSE 0 END), 0)) as weekly_deficiency
FROM public.categories c
LEFT JOIN public.activities a ON a.category_id = c.id AND a.user_id = c.user_id
WHERE c.user_id = auth.uid()
  AND c.daily_time_goal_minutes IS NOT NULL
GROUP BY c.id, c.user_id, c.name, c.color, c.daily_time_goal_minutes, c.weekly_time_goal_minutes;