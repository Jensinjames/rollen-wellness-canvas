-- Enable Row Level Security on all analytics tables
ALTER TABLE public.category_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_unaccounted_time ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategory_totals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for category_totals table
CREATE POLICY "category_totals_select_own" 
ON public.category_totals 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policies for daily_streaks table
CREATE POLICY "daily_streaks_select_own" 
ON public.daily_streaks 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policies for daily_unaccounted_time table
CREATE POLICY "daily_unaccounted_time_select_own" 
ON public.daily_unaccounted_time 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policies for goal_deficiencies table
CREATE POLICY "goal_deficiencies_select_own" 
ON public.goal_deficiencies 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policies for subcategory_totals table
CREATE POLICY "subcategory_totals_select_own" 
ON public.subcategory_totals 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Log security enhancement for audit trail
SELECT public.log_security_event(
  'security.rls_policies_added',
  auth.uid(),
  jsonb_build_object(
    'tables', ARRAY['category_totals', 'daily_streaks', 'daily_unaccounted_time', 'goal_deficiencies', 'subcategory_totals'],
    'action', 'enable_rls_and_create_policies',
    'policy_type', 'user_data_protection'
  )
);