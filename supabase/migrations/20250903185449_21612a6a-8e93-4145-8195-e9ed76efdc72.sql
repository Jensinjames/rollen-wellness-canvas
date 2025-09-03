-- 2. Create database views for analytics and insights (fixed)

-- Category totals view with goal tracking
CREATE VIEW public.category_totals AS
SELECT 
  c.user_id,
  c.id as category_id,
  c.name as category_name,
  c.color,
  c.daily_time_goal_minutes,
  c.weekly_time_goal_minutes,
  DATE(a.date_time) as activity_date,
  COALESCE(SUM(a.duration_minutes), 0) as total_minutes,
  COUNT(a.id) as activity_count,
  CASE 
    WHEN c.daily_time_goal_minutes > 0 THEN 
      ROUND((SUM(a.duration_minutes)::numeric / c.daily_time_goal_minutes::numeric) * 100, 2)
    ELSE 0
  END as daily_progress_percentage,
  CASE 
    WHEN c.weekly_time_goal_minutes > 0 THEN 
      ROUND((SUM(a.duration_minutes)::numeric / c.weekly_time_goal_minutes::numeric) * 100, 2)
    ELSE 0
  END as weekly_progress_percentage
FROM public.categories c
LEFT JOIN public.activities a ON c.id = a.category_id AND a.user_id = c.user_id
WHERE c.level = 0 AND c.user_id = auth.uid()
GROUP BY c.user_id, c.id, c.name, c.color, c.daily_time_goal_minutes, c.weekly_time_goal_minutes, DATE(a.date_time);

-- Subcategory totals view
CREATE VIEW public.subcategory_totals AS
SELECT 
  sc.user_id,
  sc.id as subcategory_id,
  sc.name as subcategory_name,
  sc.parent_id as category_id,
  pc.name as category_name,
  pc.color as category_color,
  DATE(a.date_time) as activity_date,
  COALESCE(SUM(a.duration_minutes), 0) as total_minutes,
  COUNT(a.id) as activity_count
FROM public.categories sc
JOIN public.categories pc ON sc.parent_id = pc.id
LEFT JOIN public.activities a ON sc.id = a.subcategory_id AND a.user_id = sc.user_id
WHERE sc.level = 1 AND sc.user_id = auth.uid()
GROUP BY sc.user_id, sc.id, sc.name, sc.parent_id, pc.name, pc.color, DATE(a.date_time);

-- Daily streaks view - tracks consecutive days with activity
CREATE VIEW public.daily_streaks AS
WITH daily_activity AS (
  SELECT 
    user_id,
    category_id,
    DATE(date_time) as activity_date,
    SUM(duration_minutes) as total_minutes
  FROM public.activities
  WHERE user_id = auth.uid()
  GROUP BY user_id, category_id, DATE(date_time)
),
streak_groups AS (
  SELECT 
    user_id,
    category_id,
    activity_date,
    total_minutes,
    activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id, category_id ORDER BY activity_date))::int * INTERVAL '1 day' as streak_group
  FROM daily_activity
)
SELECT 
  user_id,
  category_id,
  c.name as category_name,
  c.color,
  MIN(activity_date) as streak_start,
  MAX(activity_date) as streak_end,
  COUNT(*) as streak_length,
  SUM(total_minutes) as total_streak_minutes
FROM streak_groups sg
JOIN public.categories c ON sg.category_id = c.id
GROUP BY user_id, category_id, c.name, c.color, streak_group
ORDER BY streak_length DESC;

-- Deficiencies view - shows goals not being met
CREATE VIEW public.goal_deficiencies AS
SELECT 
  c.user_id,
  c.id as category_id,
  c.name as category_name,
  c.color,
  c.daily_time_goal_minutes,
  c.weekly_time_goal_minutes,
  DATE(a.date_time) as deficiency_date,
  COALESCE(SUM(a.duration_minutes), 0) as actual_minutes,
  GREATEST(0, c.daily_time_goal_minutes - COALESCE(SUM(a.duration_minutes), 0)) as daily_deficiency,
  GREATEST(0, c.weekly_time_goal_minutes - COALESCE(SUM(a.duration_minutes), 0)) as weekly_deficiency,
  CASE 
    WHEN c.daily_time_goal_minutes > 0 AND COALESCE(SUM(a.duration_minutes), 0) < c.daily_time_goal_minutes THEN true
    ELSE false
  END as is_daily_behind,
  CASE 
    WHEN c.weekly_time_goal_minutes > 0 AND COALESCE(SUM(a.duration_minutes), 0) < c.weekly_time_goal_minutes THEN true
    ELSE false
  END as is_weekly_behind
FROM public.categories c
LEFT JOIN public.activities a ON c.id = a.category_id AND a.user_id = c.user_id
WHERE c.level = 0 AND c.user_id = auth.uid() 
  AND (c.daily_time_goal_minutes > 0 OR c.weekly_time_goal_minutes > 0)
GROUP BY c.user_id, c.id, c.name, c.color, c.daily_time_goal_minutes, c.weekly_time_goal_minutes, DATE(a.date_time)
HAVING (c.daily_time_goal_minutes > 0 AND COALESCE(SUM(a.duration_minutes), 0) < c.daily_time_goal_minutes)
    OR (c.weekly_time_goal_minutes > 0 AND COALESCE(SUM(a.duration_minutes), 0) < c.weekly_time_goal_minutes);