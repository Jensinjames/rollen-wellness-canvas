
-- Lock down SECURITY DEFINER functions: revoke from PUBLIC/anon/authenticated, then grant only where needed.

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.cascade_delete_category(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cascade_delete_category(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.seed_default_categories(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_default_categories(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.log_security_event(text, jsonb, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text, text) TO anon, authenticated;

-- Remove broad SELECT policy on storage.objects for the avatars bucket.
-- The bucket remains public so avatars are still viewable via their public URLs,
-- but this prevents listing/enumerating all files in the bucket.
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
