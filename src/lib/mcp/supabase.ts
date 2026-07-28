import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

/**
 * Creates a Supabase client that acts as the authenticated MCP caller,
 * so all row level security policies run as that user.
 */
export function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export function requireAuth(ctx: ToolContext) {
  return ctx.isAuthenticated()
    ? null
    : {
        content: [{ type: "text" as const, text: "Not authenticated." }],
        isError: true,
      };
}

export function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    structuredContent: { data } as Record<string, unknown>,
  };
}
