-- 1. Drop unused SECURITY DEFINER helper
DROP FUNCTION IF EXISTS public.is_owner(uuid);

-- 2. Convert helpers to SECURITY INVOKER so RLS applies to the caller
CREATE OR REPLACE FUNCTION public.cascade_delete_category(category_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.categories WHERE id = category_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.seed_default_categories(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.categories (user_id, name, color, description, goal_type, daily_time_goal_minutes, weekly_time_goal_minutes, sort_order)
  VALUES
    (p_user_id, 'Work', '#3b82f6', 'Professional activities', 'time', 480, 2400, 0),
    (p_user_id, 'Exercise', '#10b981', 'Physical activity', 'time', 30, 210, 1),
    (p_user_id, 'Sleep', '#8b5cf6', 'Rest and recovery', 'time', 480, 3360, 2),
    (p_user_id, 'Social', '#f59e0b', 'Time with friends and family', 'time', 60, 420, 3),
    (p_user_id, 'Learning', '#ef4444', 'Education and skill development', 'time', 60, 420, 4);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_event_details jsonb DEFAULT '{}'::jsonb, p_ip_address text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.security_audit_logs (
    user_id, event_type, event_details, ip_address, user_agent
  ) VALUES (
    auth.uid(), p_event_type, p_event_details, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_security_event(text, jsonb, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.cascade_delete_category(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cascade_delete_category(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.seed_default_categories(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_default_categories(uuid) TO authenticated, service_role;

-- 3. Rate limiter stays SECURITY DEFINER but is no longer reachable from the browser
REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

-- 4. Remove unnecessary anon table privileges on audit logs
REVOKE ALL ON TABLE public.security_audit_logs FROM anon;