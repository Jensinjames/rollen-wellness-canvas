import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description:
    "List the signed-in user's tracking categories, including colors, goal types and daily/weekly time goals.",
  inputSchema: {
    include_inactive: z
      .boolean()
      .optional()
      .describe("Include archived/inactive categories. Defaults to false."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ include_inactive }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    let query = supabaseForUser(ctx)
      .from("categories")
      .select(
        "id, name, color, description, parent_id, level, goal_type, is_boolean_goal, boolean_goal_label, daily_time_goal_minutes, weekly_time_goal_minutes, is_active, sort_order",
      )
      .order("sort_order", { ascending: true });

    if (!include_inactive) query = query.eq("is_active", true);

    const { data, error } = await query;
    if (error) return errorResult(error.message);
    return jsonResult(data ?? []);
  },
});
