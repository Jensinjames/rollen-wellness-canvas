-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  sleep_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  goal_type TEXT NOT NULL DEFAULT 'time',
  is_boolean_goal BOOLEAN NOT NULL DEFAULT false,
  boolean_goal_label TEXT,
  daily_time_goal_minutes INTEGER,
  weekly_time_goal_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  target_unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- Create habit_logs table
CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own habit logs"
  ON public.habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own habit logs"
  ON public.habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit logs"
  ON public.habit_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit logs"
  ON public.habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create daily_scores table
CREATE TABLE public.daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_date DATE NOT NULL,
  overall_score NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, score_date)
);

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily scores"
  ON public.daily_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily scores"
  ON public.daily_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily scores"
  ON public.daily_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create cascade_delete_category function
CREATE OR REPLACE FUNCTION public.cascade_delete_category(category_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM public.categories WHERE id = category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create seed_default_categories function
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, description, goal_type, daily_time_goal_minutes, weekly_time_goal_minutes, sort_order)
  VALUES
    (p_user_id, 'Work', '#3b82f6', 'Professional activities', 'time', 480, 2400, 0),
    (p_user_id, 'Exercise', '#10b981', 'Physical activity', 'time', 30, 210, 1),
    (p_user_id, 'Sleep', '#8b5cf6', 'Rest and recovery', 'time', 480, 3360, 2),
    (p_user_id, 'Social', '#f59e0b', 'Time with friends and family', 'time', 60, 420, 3),
    (p_user_id, 'Learning', '#ef4444', 'Education and skill development', 'time', 60, 420, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create category_totals view
CREATE OR REPLACE VIEW public.category_totals AS
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

-- Create activity_streaks view
CREATE OR REPLACE VIEW public.activity_streaks AS
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

-- Create goal_deficiencies view
CREATE OR REPLACE VIEW public.goal_deficiencies AS
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