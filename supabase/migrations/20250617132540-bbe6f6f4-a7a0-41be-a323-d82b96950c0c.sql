
-- Create or replace standardized RLS policies (handling existing policies)

-- Activities table policies
DROP POLICY IF EXISTS "activities_select_own" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_own" ON public.activities;
DROP POLICY IF EXISTS "activities_update_own" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_own" ON public.activities;

CREATE POLICY "activities_select_own" ON public.activities
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "activities_insert_own" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "activities_update_own" ON public.activities
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "activities_delete_own" ON public.activities
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Categories table policies
DROP POLICY IF EXISTS "categories_select_own" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_own" ON public.categories;
DROP POLICY IF EXISTS "categories_update_own" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_own" ON public.categories;

CREATE POLICY "categories_select_own" ON public.categories
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Daily scores table policies
DROP POLICY IF EXISTS "daily_scores_select_own" ON public.daily_scores;
DROP POLICY IF EXISTS "daily_scores_insert_own" ON public.daily_scores;
DROP POLICY IF EXISTS "daily_scores_update_own" ON public.daily_scores;
DROP POLICY IF EXISTS "daily_scores_delete_own" ON public.daily_scores;

CREATE POLICY "daily_scores_select_own" ON public.daily_scores
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "daily_scores_insert_own" ON public.daily_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "daily_scores_update_own" ON public.daily_scores
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "daily_scores_delete_own" ON public.daily_scores
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Habit logs table policies
DROP POLICY IF EXISTS "habit_logs_select_own" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_insert_own" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_update_own" ON public.habit_logs;
DROP POLICY IF EXISTS "habit_logs_delete_own" ON public.habit_logs;

CREATE POLICY "habit_logs_select_own" ON public.habit_logs
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "habit_logs_insert_own" ON public.habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "habit_logs_update_own" ON public.habit_logs
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "habit_logs_delete_own" ON public.habit_logs
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Habits table policies
DROP POLICY IF EXISTS "habits_select_own" ON public.habits;
DROP POLICY IF EXISTS "habits_insert_own" ON public.habits;
DROP POLICY IF EXISTS "habits_update_own" ON public.habits;
DROP POLICY IF EXISTS "habits_delete_own" ON public.habits;

CREATE POLICY "habits_select_own" ON public.habits
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "habits_insert_own" ON public.habits
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "habits_update_own" ON public.habits
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "habits_delete_own" ON public.habits
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- Profiles table policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id AND id IS NOT NULL);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND id IS NOT NULL);

-- Sleep entries table policies
DROP POLICY IF EXISTS "sleep_entries_select_own" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_entries_insert_own" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_entries_update_own" ON public.sleep_entries;
DROP POLICY IF EXISTS "sleep_entries_delete_own" ON public.sleep_entries;

CREATE POLICY "sleep_entries_select_own" ON public.sleep_entries
  FOR SELECT USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "sleep_entries_insert_own" ON public.sleep_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "sleep_entries_update_own" ON public.sleep_entries
  FOR UPDATE USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "sleep_entries_delete_own" ON public.sleep_entries
  FOR DELETE USING (auth.uid() = user_id AND user_id IS NOT NULL);
