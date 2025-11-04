-- Fix is_owner() function: Add search_path protection and STABLE modifier
CREATE OR REPLACE FUNCTION public.is_owner(resource_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = resource_user_id;
$$;