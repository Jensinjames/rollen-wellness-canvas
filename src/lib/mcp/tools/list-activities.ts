import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_activities",
  title: "List logged activities",
  description:
    "List the signed-in user's logged time activities within an optional date range, newest first.",
  inputSchema: {
    from: z.string().optional().describe("ISO date/time lower bound, e.g. 2026-07-01."),
    to: z.string().optional().describe("ISO date/time upper bound, e.g. 2026-07-31."),
    category_id: z.string().optional().describe("Only return activities in this category."),
    limit: z.number().optional().describe("Maximum rows to return (1-200, default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, category_id, limit }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const rows = Math.min(Math.max(limit ?? 50, 1), 200);
    let query = supabaseForUser(ctx)
      .from("activities")
      .select(
        "id, category_id, start_time, end_time, duration_minutes, notes, categories(name, color)",
      )
      .order("start_time", { ascending: false })
      .limit(rows);

    if (from) query = query.gte("start_time", from);
    if (to) query = query.lte("start_time", to);
    if (category_id) query = query.eq("category_id", category_id);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});
