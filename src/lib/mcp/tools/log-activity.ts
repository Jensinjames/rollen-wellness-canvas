import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "log_activity",
  title: "Log a time activity",
  description:
    "Log time spent on a category for the signed-in user. Duration is rounded to the nearest 15-minute increment.",
  inputSchema: {
    category_id: z.string().describe("Category id from list_categories."),
    start_time: z.string().describe("ISO start date/time of the activity."),
    duration_minutes: z
      .number()
      .describe("Duration in minutes (1-1440). Rounded to 15-minute increments."),
    notes: z.string().optional().describe("Optional notes about the activity."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ category_id, start_time, duration_minutes, notes }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const start = new Date(start_time);
    if (Number.isNaN(start.getTime())) return errorResult("start_time is not a valid date/time.");

    const rounded = Math.min(Math.max(Math.round(duration_minutes / 15) * 15, 15), 1440);
    const end = new Date(start.getTime() + rounded * 60_000);

    const { data, error } = await supabaseForUser(ctx)
      .from("activities")
      .insert({
        user_id: ctx.getUserId(),
        category_id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        date_time: start.toISOString(),
        duration_minutes: rounded,
        notes: notes?.slice(0, 1000) ?? null,
      })
      .select()
      .single();

    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
