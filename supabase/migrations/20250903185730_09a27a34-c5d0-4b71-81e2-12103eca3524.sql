-- 3. Advanced validation functions for business rules

-- Function to validate 15-minute increments
CREATE OR REPLACE FUNCTION public.validate_15_minute_increments(
  duration_minutes INTEGER,
  auto_round BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If auto-round is enabled, round to nearest 15 minutes
  IF auto_round THEN
    RETURN ROUND(duration_minutes / 15.0) * 15;
  END IF;
  
  -- Check if duration is a multiple of 15
  IF duration_minutes % 15 != 0 THEN
    RAISE EXCEPTION 'Duration must be in 15-minute increments. Received: % minutes', duration_minutes;
  END IF;
  
  RETURN duration_minutes;
END;
$$;

-- Function to handle sleep cutoff logic (entries before 4 AM assigned to previous day)
CREATE OR REPLACE FUNCTION public.apply_sleep_cutoff(
  entry_datetime TIMESTAMPTZ,
  sleep_cutoff_hour INTEGER DEFAULT 4
)
RETURNS DATE
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  entry_hour INTEGER;
  entry_date DATE;
BEGIN
  entry_hour := EXTRACT(HOUR FROM entry_datetime);
  entry_date := DATE(entry_datetime);
  
  -- If entry is before sleep cutoff hour, assign to previous day
  IF entry_hour < sleep_cutoff_hour THEN
    RETURN entry_date - INTERVAL '1 day';
  END IF;
  
  RETURN entry_date;
END;
$$;

-- Function to check category guardrails (daily time limits)
CREATE OR REPLACE FUNCTION public.check_category_guardrails(
  p_user_id UUID,
  p_category_id UUID,
  p_date DATE,
  p_new_duration_minutes INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_goal INTEGER;
  current_total INTEGER;
  projected_total INTEGER;
  result JSONB;
BEGIN
  -- Get the category's daily goal
  SELECT daily_time_goal_minutes INTO category_goal
  FROM public.categories
  WHERE id = p_category_id AND user_id = p_user_id;
  
  -- If no goal is set, no guardrail check needed
  IF category_goal IS NULL OR category_goal = 0 THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current_total', 0,
      'goal', 0,
      'projected_total', p_new_duration_minutes,
      'warning', null
    );
  END IF;
  
  -- Calculate current total for the category on this date
  SELECT COALESCE(SUM(duration_minutes), 0) INTO current_total
  FROM public.activities
  WHERE user_id = p_user_id 
    AND category_id = p_category_id
    AND DATE(date_time) = p_date;
  
  projected_total := current_total + p_new_duration_minutes;
  
  -- Build result
  result := jsonb_build_object(
    'allowed', projected_total <= category_goal,
    'current_total', current_total,
    'goal', category_goal,
    'projected_total', projected_total,
    'excess_minutes', GREATEST(0, projected_total - category_goal)
  );
  
  -- Add warning if approaching or exceeding limit
  IF projected_total > category_goal THEN
    result := result || jsonb_build_object(
      'warning', format('This activity would exceed the daily goal by %s minutes', projected_total - category_goal)
    );
  ELSIF projected_total > (category_goal * 0.8) THEN
    result := result || jsonb_build_object(
      'warning', format('This activity will use %s%% of your daily goal', ROUND((projected_total::float / category_goal) * 100))
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Function to calculate unaccounted time for a user on a specific date
CREATE OR REPLACE FUNCTION public.calculate_unaccounted_time(
  p_user_id UUID,
  p_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_tracked INTEGER;
  unaccounted INTEGER;
BEGIN
  -- Calculate total tracked time for the date
  SELECT COALESCE(SUM(duration_minutes), 0) INTO total_tracked
  FROM public.activities
  WHERE user_id = p_user_id
    AND DATE(date_time) = p_date;
  
  -- Calculate unaccounted time (1440 minutes in a day)
  unaccounted := 1440 - total_tracked;
  
  -- Ensure non-negative result
  RETURN GREATEST(0, unaccounted);
END;
$$;

-- Function to update rollups_daily table (for materialized view-like performance)
CREATE OR REPLACE FUNCTION public.refresh_daily_rollups(
  p_user_id UUID,
  p_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete existing rollups for this user and date
  DELETE FROM public.rollups_daily
  WHERE user_id = p_user_id AND date = p_date;
  
  -- Insert fresh rollups
  INSERT INTO public.rollups_daily (
    user_id,
    date,
    category_id,
    subcategory_id,
    total_minutes,
    goal_minutes,
    activity_count,
    unaccounted_minutes
  )
  SELECT 
    a.user_id,
    p_date,
    a.category_id,
    a.subcategory_id,
    SUM(a.duration_minutes),
    COALESCE(c.daily_time_goal_minutes, 0),
    COUNT(a.id),
    public.calculate_unaccounted_time(a.user_id, p_date)
  FROM public.activities a
  JOIN public.categories c ON a.category_id = c.id
  WHERE a.user_id = p_user_id 
    AND DATE(a.date_time) = p_date
  GROUP BY a.user_id, a.category_id, a.subcategory_id, c.daily_time_goal_minutes;
END;
$$;