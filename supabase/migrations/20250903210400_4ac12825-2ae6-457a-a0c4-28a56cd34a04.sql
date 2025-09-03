-- Enable Row Level Security on category_totals view
ALTER VIEW public.category_totals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own category totals
CREATE POLICY "Users can view their own category totals" 
ON public.category_totals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Log the security fix
SELECT public.secure_log_audit_event(
  'security.rls_enabled',
  auth.uid(),
  jsonb_build_object(
    'table_name', 'category_totals',
    'action', 'enabled_rls_and_created_policies',
    'description', 'Fixed security vulnerability - enabled RLS on category_totals view'
  )
);