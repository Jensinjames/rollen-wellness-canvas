import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCategories from "./tools/list-categories";
import listActivities from "./tools/list-activities";
import logActivity from "./tools/log-activity";
import listHabits from "./tools/list-habits";
import logHabit from "./tools/log-habit";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rollen-mcp",
  title: "Rollen",
  version: "0.1.0",
  instructions:
    "Tools for Rollen, a personal wellness and time tracking app. Use `list_categories` to discover the user's categories, `log_activity` to record time spent, `list_activities` to review logged time, and `list_habits`/`log_habit` for daily habit tracking. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCategories, listActivities, logActivity, listHabits, logHabit],
});
