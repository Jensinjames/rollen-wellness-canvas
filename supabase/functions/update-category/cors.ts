
// CORS configuration with allowlist via ALLOWED_ORIGINS (comma-separated)
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const corsHeaders = (origin?: string | null) => {
  const allowOrigin = allowedOrigins.length
    ? (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0])
    : '*';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } as const;
};

export const handleCorsOptions = (req: Request) => {
  return new Response(null, { headers: corsHeaders(req.headers.get('Origin')) });
};
