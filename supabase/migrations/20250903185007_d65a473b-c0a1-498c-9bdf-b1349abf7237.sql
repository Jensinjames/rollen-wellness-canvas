-- Phase 2: Validation & Business Rules Enhancement

-- 1. Create rollups_daily table for pre-computed aggregations
CREATE TABLE public.rollups_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  subcategory_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  total_minutes INTEGER DEFAULT 0,
  goal_minutes INTEGER DEFAULT 0,
  unaccounted_minutes INTEGER DEFAULT 0,
  activity_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, category_id, subcategory_id)
);

-- Enable RLS on rollups_daily
ALTER TABLE public.rollups_daily ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rollups_daily
CREATE POLICY "rollups_daily_select_own" 
ON public.rollups_daily 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "rollups_daily_insert_own" 
ON public.rollups_daily 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rollups_daily_update_own" 
ON public.rollups_daily 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "rollups_daily_delete_own" 
ON public.rollups_daily 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_rollups_daily_user_date ON public.rollups_daily(user_id, date);
CREATE INDEX idx_rollups_daily_category ON public.rollups_daily(user_id, category_id, date);

-- Add trigger for updated_at
CREATE TRIGGER update_rollups_daily_timestamp
BEFORE UPDATE ON public.rollups_daily
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();