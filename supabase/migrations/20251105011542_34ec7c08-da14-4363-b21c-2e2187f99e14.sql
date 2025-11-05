-- =====================================================
-- Server-Side Rate Limiting Implementation
-- =====================================================
-- Creates rate_limit_attempts table with proper RLS
-- and implements actual rate limiting enforcement
-- =====================================================

-- Create the rate_limit_attempts table
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON public.rate_limit_attempts(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limit_locked_until ON public.rate_limit_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own rate limit status (authenticated only)
CREATE POLICY "Users can view their own rate limit status"
  ON public.rate_limit_attempts
  FOR SELECT
  TO authenticated
  USING (identifier = auth.jwt()->>'email');

-- Replace the placeholder check_rate_limit function with actual enforcement
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier TEXT,
  max_requests INTEGER DEFAULT 5,
  window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_record RECORD;
  window_start_time TIMESTAMPTZ;
  lockout_duration_seconds INTEGER := 900; -- 15 minutes
  result JSONB;
BEGIN
  -- Calculate window start time
  window_start_time := NOW() - (window_seconds || ' seconds')::INTERVAL;
  
  -- Clean up expired entries (older than 1 hour)
  DELETE FROM public.rate_limit_attempts
  WHERE window_start < NOW() - INTERVAL '1 hour'
    AND (locked_until IS NULL OR locked_until < NOW());
  
  -- Get or create the rate limit record with row locking
  SELECT * INTO current_record
  FROM public.rate_limit_attempts
  WHERE rate_limit_attempts.identifier = check_rate_limit.identifier
  FOR UPDATE;
  
  -- Check if currently locked out
  IF current_record IS NOT NULL AND current_record.locked_until IS NOT NULL THEN
    IF current_record.locked_until > NOW() THEN
      -- Still locked out
      result := jsonb_build_object(
        'allowed', false,
        'remaining', 0,
        'reset_at', EXTRACT(EPOCH FROM current_record.locked_until)::BIGINT
      );
      RETURN result;
    ELSE
      -- Lockout expired, delete the record to start fresh
      DELETE FROM public.rate_limit_attempts
      WHERE rate_limit_attempts.identifier = check_rate_limit.identifier;
      current_record := NULL;
    END IF;
  END IF;
  
  -- If no record exists or window expired, create/reset
  IF current_record IS NULL OR current_record.window_start < window_start_time THEN
    -- Insert or update to start a new window
    INSERT INTO public.rate_limit_attempts (identifier, attempt_count, window_start)
    VALUES (check_rate_limit.identifier, 1, NOW())
    ON CONFLICT (identifier) DO UPDATE
    SET attempt_count = 1,
        window_start = NOW(),
        locked_until = NULL,
        updated_at = NOW();
    
    result := jsonb_build_object(
      'allowed', true,
      'remaining', max_requests - 1
    );
    RETURN result;
  END IF;
  
  -- Increment attempt count
  UPDATE public.rate_limit_attempts
  SET attempt_count = attempt_count + 1,
      updated_at = NOW()
  WHERE rate_limit_attempts.identifier = check_rate_limit.identifier;
  
  -- Check if exceeded max requests
  IF current_record.attempt_count + 1 > max_requests THEN
    -- Lock the user out
    UPDATE public.rate_limit_attempts
    SET locked_until = NOW() + (lockout_duration_seconds || ' seconds')::INTERVAL,
        updated_at = NOW()
    WHERE rate_limit_attempts.identifier = check_rate_limit.identifier;
    
    result := jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_at', EXTRACT(EPOCH FROM (NOW() + (lockout_duration_seconds || ' seconds')::INTERVAL))::BIGINT
    );
    RETURN result;
  END IF;
  
  -- Still within limits
  result := jsonb_build_object(
    'allowed', true,
    'remaining', max_requests - (current_record.attempt_count + 1)
  );
  RETURN result;
END;
$$;

-- Add unique constraint on identifier to prevent race conditions
ALTER TABLE public.rate_limit_attempts 
ADD CONSTRAINT unique_identifier UNIQUE (identifier);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_rate_limit_attempts_updated_at
  BEFORE UPDATE ON public.rate_limit_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.rate_limit_attempts TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO anon, authenticated;