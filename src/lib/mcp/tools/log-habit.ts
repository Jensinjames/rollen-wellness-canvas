import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "log_habit",
  title: "Log a habit value",
  description:
    "Record a habit value for a given day for the signed-in user. A habit counts as complete when the value reaches its target.",
  inputSchema: {
    habit_id: z.string().describe("Habit id from list_habits."),
    value: z.number().describe("Recorded value for the day, e.g. glasses of water."),
    log_date: z.string().optional().describe("Date in YYYY-MM-DD. Defaults to today."),
    notes: z.string().optional().describe("Optional notes for this log."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ habit_id, value, log_date, notes }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const date = log_date ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("habit_logs")
      .insert({
        user_id: ctx.getUserId(),
        habit_id,
        log_date: date,
        value,
        notes: notes?.slice(0, 1000) ?? null,
      })
      .select()
      .single();

    if (error) return errorResult(error.message);
    return jsonResult(data);
  },
});
