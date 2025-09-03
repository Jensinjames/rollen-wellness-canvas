-- Enable Row Level Security on category_totals table
ALTER TABLE public.category_totals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for SELECT operations
CREATE POLICY "category_totals_select_own" 
ON public.category_totals 
FOR SELECT 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policy for INSERT operations  
CREATE POLICY "category_totals_insert_own" 
ON public.category_totals 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policy for UPDATE operations
CREATE POLICY "category_totals_update_own" 
ON public.category_totals 
FOR UPDATE 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));

-- Create RLS policy for DELETE operations
CREATE POLICY "category_totals_delete_own" 
ON public.category_totals 
FOR DELETE 
USING ((auth.uid() = user_id) AND (user_id IS NOT NULL));