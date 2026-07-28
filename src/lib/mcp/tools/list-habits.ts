import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, requireAuth, errorResult, jsonResult } from "../supabase";

export default defineTool({
  name: "list_habits",
  title: "List habits and recent logs",
  description:
    "List the signed-in user's habits with their targets, plus habit logs from the last N days.",
  inputSchema: {
    days: z.number().optional().describe("How many days of logs to include (default 7, max 90)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const supabase = supabaseForUser(ctx);
    const window = Math.min(Math.max(days ?? 7, 1), 90);
    const since = new Date(Date.now() - window * 86_400_000).toISOString().slice(0, 10);

    const [habits, logs] = await Promise.all([
      supabase
        .from("habits")
        .select("id, name, description, target_value, target_unit, is_active")
        .eq("is_active", true),
      supabase
        .from("habit_logs")
        .select("id, habit_id, log_date, value, notes")
        .gte("log_date", since)
        .order("log_date", { ascending: false }),
    ]);

    if (habits.error) return errorResult(habits.error.message);
    if (logs.error) return errorResult(logs.error.message);

    return jsonResult({ habits: habits.data ?? [], logs: logs.data ?? [] });
  },
});
