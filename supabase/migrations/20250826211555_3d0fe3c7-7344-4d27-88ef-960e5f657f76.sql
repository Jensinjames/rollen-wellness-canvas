-- Security Enhancement: Restrict audit log access and add profile deletion policy

-- 1. Update security_audit_log RLS policies to be more restrictive
DROP POLICY IF EXISTS "Authenticated and ServiceRole can insert audit log" ON public.security_audit_log;

-- Only allow service role and security functions to insert audit logs
CREATE POLICY "Restrict audit log insert to service role and security functions" 
ON public.security_audit_log
FOR INSERT 
WITH CHECK (
  -- Allow service role
  auth.jwt() ->> 'role' = 'service_role' OR
  -- Allow authenticated users only through security functions
  (auth.uid() IS NOT NULL AND current_setting('app.security_context', true) = 'audit_log')
);

-- Add validation for audit log entries
CREATE OR REPLACE FUNCTION public.validate_audit_log_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validate event_type is not empty
  IF LENGTH(TRIM(NEW.event_type)) = 0 THEN
    RAISE EXCEPTION 'Event type cannot be empty';
  END IF;

  -- Validate event_type format (alphanumeric, dots, underscores only)
  IF NEW.event_type !~ '^[a-zA-Z0-9._]+$' THEN
    RAISE EXCEPTION 'Invalid event type format';
  END IF;

  -- Validate details is proper JSON if provided
  IF NEW.details IS NOT NULL THEN
    BEGIN
      -- This will raise an exception if details is not valid JSON
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

  RETURN NEW;
END;
$$;

-- Create trigger for audit log validation
DROP TRIGGER IF EXISTS validate_audit_log_trigger ON public.security_audit_log;
CREATE TRIGGER validate_audit_log_trigger
  BEFORE INSERT ON public.security_audit_log
  FOR EACH ROW EXECUTE FUNCTION validate_audit_log_entry();

-- 2. Add DELETE policy for profiles table to allow users to delete their own data
CREATE POLICY "Users can delete their own profile" 
ON public.profiles
FOR DELETE 
USING (auth.uid() = id AND id IS NOT NULL);

-- 3. Create a secure audit logging function that sets the security context
CREATE OR REPLACE FUNCTION public.secure_log_audit_event(
  event_type_param text,
  user_id_param uuid DEFAULT auth.uid(),
  details_param jsonb DEFAULT '{}'::jsonb,
  ip_address_param text DEFAULT NULL,
  user_agent_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Set security context to allow audit log insertion
  PERFORM set_config('app.security_context', 'audit_log', true);
  
  -- Insert the audit log entry
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    details,
    ip_address,
    user_agent,
    created_at
  ) VALUES (
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
    -- Reset context and re-raise
    PERFORM set_config('app.security_context', '', true);
    RAISE;
END;
$$;