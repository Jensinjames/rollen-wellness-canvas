-- Security hardening and function standardization
-- Standardize search_path and ensure consistent behavior for key helper functions

-- Update: categories timestamp function
CREATE OR REPLACE FUNCTION public.update_categories_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Update: activities timestamp function
CREATE OR REPLACE FUNCTION public.update_activities_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Ensure consistent logging function definition with exception safety
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid DEFAULT auth.uid(),
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT ((current_setting('request.headers'::text, true))::jsonb ->> 'x-forwarded-for'::text),
  user_agent text DEFAULT ((current_setting('request.headers'::text, true))::jsonb ->> 'user-agent'::text)
)
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    now()
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Never fail the caller due to logging
    NULL;
END;
$$;

-- Add comments for traceability
COMMENT ON FUNCTION public.update_categories_timestamp() IS 'Keeps categories.updated_at in sync (standardized search_path)';
COMMENT ON FUNCTION public.update_activities_timestamp() IS 'Keeps activities.updated_at in sync (standardized search_path)';
COMMENT ON FUNCTION public.log_security_event(text, uuid, jsonb, text, text) IS 'Centralized non-fatal security audit logger';