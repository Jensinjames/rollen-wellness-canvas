-- Phase 1: Critical Schema Fixes for security_audit_log

-- 1. Fix ID column default value (change from auth.uid() to gen_random_uuid())
ALTER TABLE public.security_audit_log 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Drop the overly restrictive RLS INSERT policy
DROP POLICY IF EXISTS "Restrict audit log insert to service role and security function" ON public.security_audit_log;

-- 3. Create new, more permissive RLS INSERT policy
CREATE POLICY "Allow authenticated users to insert audit logs" 
ON public.security_audit_log 
FOR INSERT 
WITH CHECK (
  -- Allow service role to insert anything
  (auth.jwt() ->> 'role' = 'service_role') 
  OR 
  -- Allow authenticated users to insert audit logs for themselves or system events
  (
    auth.uid() IS NOT NULL 
    AND (
      user_id = auth.uid() 
      OR user_id IS NULL 
      OR current_setting('app.security_context', true) = 'audit_log'
    )
  )
);

-- 4. Update secure_log_audit_event function to work with new schema
CREATE OR REPLACE FUNCTION public.secure_log_audit_event(
  event_type_param text, 
  user_id_param uuid DEFAULT auth.uid(), 
  details_param jsonb DEFAULT '{}'::jsonb, 
  ip_address_param text DEFAULT NULL::text, 
  user_agent_param text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  -- Generate explicit UUID for the audit log entry
  new_id := gen_random_uuid();
  
  -- Set security context to allow audit log insertion
  PERFORM set_config('app.security_context', 'audit_log', true);
  
  -- Insert the audit log entry with explicit ID
  INSERT INTO public.security_audit_log (
    id,
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
    new_id,
    event_type_param,
    user_id_param,
    details_param,
    ip_address_param,
    user_agent_param,
    now()
  );
  
  -- Reset security context
  PERFORM set_config('app.security_context', '', true);
EXCEPTION
  WHEN OTHERS THEN
    -- Reset context and log error, but don't fail the calling operation
    PERFORM set_config('app.security_context', '', true);
    
    -- Log the error but don't re-raise to prevent breaking the main operation
    RAISE WARNING 'Failed to log security event: % - %', SQLSTATE, SQLERRM;
END;
$function$;

-- 5. Create enhanced validation trigger
CREATE OR REPLACE FUNCTION public.validate_security_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate event_type is not empty
  IF LENGTH(TRIM(NEW.event_type)) = 0 THEN
    RAISE EXCEPTION 'Event type cannot be empty';
  END IF;

  -- Validate event_type format (alphanumeric, dots, underscores only)
  IF NEW.event_type !~ '^[a-zA-Z0-9._]+$' THEN
    RAISE EXCEPTION 'Invalid event type format: %', NEW.event_type;
  END IF;

  -- Ensure ID is set (should be handled by default now)
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  -- Validate details is proper JSON if provided
  IF NEW.details IS NOT NULL THEN
    BEGIN
      -- Test JSON validity
      PERFORM NEW.details::jsonb;
    EXCEPTION 
      WHEN others THEN
        RAISE EXCEPTION 'Invalid JSON in details field';
    END;
  END IF;

  -- Prevent excessively large audit entries
  IF LENGTH(NEW.details::text) > 10000 THEN
    RAISE EXCEPTION 'Audit log details too large (max 10KB)';
  END IF;

  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. Create trigger for validation
DROP TRIGGER IF EXISTS validate_security_audit_log_trigger ON public.security_audit_log;
CREATE TRIGGER validate_security_audit_log_trigger
  BEFORE INSERT OR UPDATE ON public.security_audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_security_audit_log();

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.secure_log_audit_event(text, uuid, jsonb, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_security_audit_log() TO authenticated;